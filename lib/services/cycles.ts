import { db } from '@/lib/db'
import { CycleStatus } from '@prisma/client'

export async function listCycles(orgId: string) {
  return db.reviewCycle.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createCycle(orgId: string, data: {
  title: string
  startDate: string
  endDate: string
  templateId?: string
}) {
  const start = new Date(data.startDate)
  const end   = new Date(data.endDate)

  if (isNaN(start.getTime())) throw new Error('Invalid start date')
  if (isNaN(end.getTime()))   throw new Error('Invalid end date')
  if (end <= start)           throw new Error('End date must be after start date')

  return db.reviewCycle.create({
    data: { orgId, title: data.title, startDate: start, endDate: end, templateId: data.templateId ?? null },
  })
}

export async function updateCycleStatus(orgId: string, id: string, status: CycleStatus) {
  return db.reviewCycle.update({ where: { id, orgId }, data: { status } })
}

export async function getCycle(orgId: string, id: string) {
  return db.reviewCycle.findFirst({ where: { id, orgId } })
}

export async function snapshotTemplateForCycle(orgId: string, cycleId: string) {
  const existing = await db.cycleQuestion.count({ where: { cycleId } })
  if (existing > 0) return

  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
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
      where: { orgId, isActive: true },
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

export async function deleteCycle(orgId: string, id: string) {
  // Schema has onDelete: Cascade on reviewResponse, reviewAssignment, cycleQuestion → reviewCycle.
  // After running `prisma migrate dev`, a single delete cascades everything.
  await db.reviewCycle.delete({ where: { id, orgId } })
}
