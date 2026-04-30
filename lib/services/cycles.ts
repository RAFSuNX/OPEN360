import { db } from '@/lib/db'
import { CycleStatus } from '@prisma/client'

export async function listCycles() {
  return db.reviewCycle.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createCycle(data: { title: string; startDate: string; endDate: string; templateId?: string }) {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)

  // [P3] Validate dates before persisting
  if (isNaN(start.getTime())) throw new Error('Invalid start date')
  if (isNaN(end.getTime())) throw new Error('Invalid end date')
  if (end <= start) throw new Error('End date must be after start date')

  return db.reviewCycle.create({
    data: { title: data.title, startDate: start, endDate: end, templateId: data.templateId ?? null },
  })
}

export async function updateCycleStatus(id: string, status: CycleStatus) {
  return db.reviewCycle.update({ where: { id }, data: { status } })
}

export async function getCycle(id: string) {
  return db.reviewCycle.findUnique({ where: { id } })
}

export async function snapshotTemplateForCycle(cycleId: string) {
  const existing = await db.cycleQuestion.count({ where: { cycleId } })
  if (existing > 0) return

  const cycle = await db.reviewCycle.findUnique({ where: { id: cycleId } })
  if (!cycle) throw new Error('Cycle not found')

  if (cycle.templateId) {
    const items = await db.questionTemplateItem.findMany({
      where: { templateId: cycle.templateId },
      orderBy: { sortOrder: 'asc' },
    })
    await db.cycleQuestion.createMany({
      data: items.map(item => ({
        cycleId,
        sourceTemplateItemId: item.id,
        text: item.text,
        type: item.type,
        ratingScale: item.ratingScale,
        category: item.category,
        sortOrder: item.sortOrder,
      })),
    })
  } else {
    const questions = await db.question.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    await db.cycleQuestion.createMany({
      data: questions.map(q => ({
        cycleId,
        sourceTemplateItemId: null,
        text: q.text,
        type: q.type,
        ratingScale: q.ratingScale,
        category: q.category,
        sortOrder: q.sortOrder,
      })),
    })
  }
}

export async function deleteCycle(id: string) {
  await db.$transaction([
    db.reviewResponse.deleteMany({ where: { cycleId: id } }),
    db.reviewAssignment.deleteMany({ where: { cycleId: id } }),
    db.reviewCycle.delete({ where: { id } }),
  ])
}
