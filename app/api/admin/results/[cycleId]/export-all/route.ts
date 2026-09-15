import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildResults } from '@/lib/services/results'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { cycleId } = await params

  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
  if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revieweeIds = await db.reviewAssignment.findMany({
    where: { cycleId },
    select: { revieweeId: true },
    distinct: ['revieweeId'],
  })

  const employees = await db.employee.findMany({
    where: { id: { in: revieweeIds.map(r => r.revieweeId) }, orgId, isExternal: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const all = await Promise.all(
    employees.map(async emp => ({
      id: emp.id,
      name: emp.name,
      results: await buildResults(orgId, cycleId, emp.id, true),
    }))
  )

  return NextResponse.json({ cycleTitle: cycle.title, employees: all })
}
