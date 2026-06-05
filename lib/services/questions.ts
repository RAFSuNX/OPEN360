import { db } from '@/lib/db'
import { QuestionType } from '@prisma/client'

export async function listQuestions(orgId: string) {
  return db.question.findMany({
    where: { orgId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createQuestion(orgId: string, data: {
  text: string
  type: QuestionType
  category: string
  ratingScale?: number
  sortOrder?: number
}) {
  const sortOrder = data.sortOrder ?? await nextSortOrder(orgId)
  return db.question.create({
    data: {
      orgId,
      text: data.text,
      type: data.type,
      category: data.category,
      ratingScale: data.type === 'RATING' ? (data.ratingScale ?? 5) : null,
      sortOrder,
    },
  })
}

async function nextSortOrder(orgId: string): Promise<number> {
  const max = await db.question.findFirst({
    where: { orgId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return (max?.sortOrder ?? -1) + 1
}

export async function toggleQuestionActive(orgId: string, id: string, isActive: boolean) {
  return db.question.update({ where: { id, orgId }, data: { isActive } })
}

export async function updateQuestion(orgId: string, id: string, data: {
  text?: string
  type?: 'RATING' | 'OPEN_TEXT'
  category?: string
  ratingScale?: number | null
  isActive?: boolean
}) {
  return db.question.update({ where: { id, orgId }, data })
}
