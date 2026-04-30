import { db } from '@/lib/db'
import { CycleStatus } from '@prisma/client'

export async function listCycles() {
  return db.reviewCycle.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createCycle(data: { title: string; startDate: string; endDate: string }) {
  return db.reviewCycle.create({
    data: { title: data.title, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
  })
}

export async function updateCycleStatus(id: string, status: CycleStatus) {
  return db.reviewCycle.update({ where: { id }, data: { status } })
}

export async function getCycle(id: string) {
  return db.reviewCycle.findUnique({ where: { id } })
}
