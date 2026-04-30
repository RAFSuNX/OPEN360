import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { Relationship } from '@prisma/client'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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
    include: { question: true },
    orderBy: [{ relationship: 'asc' }, { question: { sortOrder: 'asc' } }],
  })

  const rows: string[] = [
    ['Question', 'Category', 'Type', 'Relationship', 'Answer/Average'].map(csvEscape).join(','),
  ]

  const relOrder: Relationship[] = [Relationship.SELF, Relationship.MANAGER, Relationship.PEER, Relationship.DIRECT_REPORT]

  for (const rel of relOrder) {
    const relResponses = responses.filter(r => r.relationship === rel)

    const byQuestion = new Map<string, { question: typeof relResponses[0]['question']; answers: string[] }>()
    for (const r of relResponses) {
      let decrypted: string
      try {
        decrypted = decrypt(r.answerEncrypted)
      } catch {
        decrypted = '[decryption error]'
      }
      const existing = byQuestion.get(r.questionId)
      if (existing) {
        existing.answers.push(decrypted)
      } else {
        byQuestion.set(r.questionId, { question: r.question, answers: [decrypted] })
      }
    }

    for (const { question, answers } of byQuestion.values()) {
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
