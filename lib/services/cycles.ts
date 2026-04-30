import { db } from '@/lib/db'
import { CycleStatus } from '@prisma/client'

export async function listCycles() {
  return db.reviewCycle.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createCycle(data: { title: string; startDate: string; endDate: string }) {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)

  // [P3] Validate dates before persisting
  if (isNaN(start.getTime())) throw new Error('Invalid start date')
  if (isNaN(end.getTime())) throw new Error('Invalid end date')
  if (end <= start) throw new Error('End date must be after start date')

  return db.reviewCycle.create({
    data: { title: data.title, startDate: start, endDate: end },
  })
}

export async function updateCycleStatus(id: string, status: CycleStatus) {
  return db.reviewCycle.update({ where: { id }, data: { status } })
}

export async function getCycle(id: string) {
  return db.reviewCycle.findUnique({ where: { id } })
}

export async function deleteCycle(id: string) {
  await db.$transaction([
    db.reviewResponse.deleteMany({ where: { cycleId: id } }),
    db.reviewAssignment.deleteMany({ where: { cycleId: id } }),
    db.reviewCycle.delete({ where: { id } }),
  ])
}
