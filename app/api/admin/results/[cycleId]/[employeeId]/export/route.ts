import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { Relationship } from '@prisma/client'

function csvEscape(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `\t${value}` : value
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\t')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cycleId: string; employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cycleId, employeeId } = await params

  const responses = await db.reviewResponse.findMany({
    where: { cycleId, revieweeId: employeeId },
    include: { question: true, cycleQuestion: true },
  })

  // Build a unified question lookup regardless of source
  const getQ = (r: typeof responses[number]) => {
    if (r.cycleQuestion) return { id: r.cycleQuestion.id, text: r.cycleQuestion.text, category: r.cycleQuestion.category, type: r.cycleQuestion.type }
    if (r.question) return { id: r.question.id, text: r.question.text, category: r.question.category, type: r.question.type }
    return null
  }
  const getQId = (r: typeof responses[number]) => r.cycleQuestionId ?? r.questionId

  const rows: string[] = [
    ['Question', 'Category', 'Type', 'Relationship', 'Answer/Average'].map(csvEscape).join(','),
  ]

  const relOrder: Relationship[] = [Relationship.SELF, Relationship.MANAGER, Relationship.PEER, Relationship.DIRECT_REPORT]

  for (const rel of relOrder) {
    const relResponses = responses.filter(r => r.relationship === rel)

    const byQuestion = new Map<string, { question: ReturnType<typeof getQ>; answers: string[] }>()
    for (const r of relResponses) {
      const qId = getQId(r)
      if (!qId) continue
      let decrypted: string
      try { decrypted = decrypt(r.answerEncrypted) } catch { decrypted = '[decryption error]' }
      const existing = byQuestion.get(qId)
      if (existing) {
        existing.answers.push(decrypted)
      } else {
        byQuestion.set(qId, { question: getQ(r), answers: [decrypted] })
      }
    }

    for (const { question, answers } of byQuestion.values()) {
      if (!question) continue
      let answerCell: string
      if (question.type === 'RATING') {
        const nums = answers.map(Number).filter(n => !isNaN(n) && n > 0)
        answerCell = nums.length > 0
          ? String(Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10)
          : ''
      } else {
        answerCell = answers.join(' | ')
      }
      rows.push(
        [question.text, question.category, question.type, rel, answerCell].map(csvEscape).join(',')
      )
    }
  }

  const csv = rows.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="results-${cycleId}-${employeeId}.csv"`,
    },
  })
}
