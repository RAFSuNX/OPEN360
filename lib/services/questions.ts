import { db } from '@/lib/db'
import { QuestionType } from '@prisma/client'

export async function listQuestions() {
  return db.question.findMany({ orderBy: { sortOrder: 'asc' } })
}

export async function createQuestion(data: {
  text: string
  type: QuestionType
  category: string
  ratingScale?: number
  sortOrder?: number
}) {
  const sortOrder = data.sortOrder ?? await nextSortOrder()
  return db.question.create({
    data: {
      text: data.text,
      type: data.type,
      category: data.category,
      ratingScale: data.type === 'RATING' ? (data.ratingScale ?? 5) : null,
      sortOrder,
    },
  })
}

async function nextSortOrder(): Promise<number> {
  const max = await db.question.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
  return (max?.sortOrder ?? -1) + 1
}

export async function toggleQuestionActive(id: string, isActive: boolean) {
  return db.question.update({ where: { id }, data: { isActive } })
}

export async function updateQuestion(id: string, data: {
  text?: string
  type?: 'RATING' | 'OPEN_TEXT'
  category?: string
  ratingScale?: number | null
  isActive?: boolean
}) {
  return db.question.update({ where: { id }, data })
}
