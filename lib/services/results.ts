import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { Relationship } from '@prisma/client'

async function getAnonymityThreshold(): Promise<number> {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'anonymity_threshold' } })
    if (!setting) return 1
    const parsed = parseInt(setting.value, 10)
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  } catch {
    return 1
  }
}

interface QuestionResult {
  id: string
  text: string
  type: string
  category: string
  average?: number
  answers?: string[]
}

interface RelationshipResult {
  relationship: Relationship
  visible: boolean
  reason?: string
  questions: QuestionResult[]
}

export async function buildResults(cycleId: string, revieweeId: string, forAdmin = false): Promise<Record<string, RelationshipResult>> {
  const threshold = forAdmin ? 1 : await getAnonymityThreshold()

  const cycleQuestionsRaw = await db.cycleQuestion.findMany({
    where: { cycleId },
    orderBy: { sortOrder: 'asc' },
  })
  const useCycleQuestions = cycleQuestionsRaw.length > 0

  const responses = await db.reviewResponse.findMany({
    where: { cycleId, revieweeId },
  })

  const questions = useCycleQuestions
    ? cycleQuestionsRaw.map(q => ({ id: q.id, text: q.text, type: q.type as string, category: q.category, ratingScale: q.ratingScale }))
    : (await db.question.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }))
        .map(q => ({ id: q.id, text: q.text, type: q.type as string, category: q.category, ratingScale: q.ratingScale }))

  const getResponseQId = (r: typeof responses[number]) =>
    useCycleQuestions ? r.cycleQuestionId : r.questionId

  const submittedCounts = await db.reviewAssignment.groupBy({
    by: ['relationship'],
    where: { cycleId, revieweeId, submitted: true },
    _count: { _all: true },
  })
  const countByRel = Object.fromEntries(submittedCounts.map(r => [r.relationship, r._count._all]))

  const result: Record<string, RelationshipResult> = {}

  for (const rel of [Relationship.SELF, Relationship.MANAGER, Relationship.PEER, Relationship.DIRECT_REPORT]) {
    const relResponses = responses.filter(r => r.relationship === rel)
    const submittedCount = countByRel[rel] ?? 0

    const thresholdRequired = !forAdmin && (rel === Relationship.PEER || rel === Relationship.DIRECT_REPORT)
    if (thresholdRequired && submittedCount < threshold) {
      result[rel] = {
        relationship: rel,
        visible: false,
        reason: `Not enough responses to display anonymously (${submittedCount} of ${threshold} required).`,
        questions: [],
      }
      continue
    }

    if (relResponses.length === 0) {
      result[rel] = { relationship: rel, visible: false, reason: 'No responses yet.', questions: [] }
      continue
    }

    const questionResults = questions.map(q => {
      const qResponses = relResponses.filter(r => getResponseQId(r) === q.id)
      const decrypted = qResponses.map(r => {
        try { return decrypt(r.answerEncrypted) } catch { return null }
      }).filter(Boolean) as string[]

      if (q.type === 'RATING') {
        const nums = decrypted.map(Number).filter(n => !isNaN(n) && n > 0)
        const average = nums.length > 0
          ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
          : undefined
        return { id: q.id, text: q.text, type: q.type, category: q.category, average }
      }

      return { id: q.id, text: q.text, type: q.type, category: q.category, answers: decrypted }
    })

    result[rel] = { relationship: rel, visible: true, questions: questionResults }
  }

  return result
}
