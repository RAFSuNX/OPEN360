import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const [
    totalEmployees,
    totalCycles,
    activeCycles,
    closedCycles,
    departments,
    recentCycles,
  ] = await Promise.all([
    db.employee.count({ where: { orgId } }),
    db.reviewCycle.count({ where: { orgId } }),
    db.reviewCycle.count({ where: { orgId, status: 'ACTIVE' } }),
    db.reviewCycle.count({ where: { orgId, status: 'CLOSED' } }),
    db.employee.groupBy({
      by: ['department'],
      where: { orgId },
      _count: { _all: true },
    }),
    db.reviewCycle.findMany({
      where: { orgId },
      orderBy: { endDate: 'desc' },
      take: 10,
    }),
  ])

  // Submission stats per cycle
  const cycleStats = await Promise.all(
    recentCycles.map(async (cycle) => {
      const [total, submitted] = await Promise.all([
        db.reviewAssignment.count({ where: { cycleId: cycle.id, NOT: { relationship: 'SELF' } } }),
        db.reviewAssignment.count({ where: { cycleId: cycle.id, submitted: true, NOT: { relationship: 'SELF' } } }),
      ])
      const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
      return {
        id: cycle.id,
        title: cycle.title,
        status: cycle.status,
        endDate: cycle.endDate,
        total,
        submitted,
        pct,
      }
    })
  )

  // Dept breakdown with review coverage
  const deptBreakdown = await Promise.all(
    departments
      .filter(d => d.department)
      .map(async (d) => {
        const empIds = await db.employee.findMany({
          where: { orgId, department: d.department },
          select: { id: true },
        })
        const ids = empIds.map(e => e.id)
        const reviewedCount = await db.reviewAssignment.groupBy({
          by: ['revieweeId'],
          where: { revieweeId: { in: ids }, submitted: true },
        })
        return {
          department: d.department!,
          count: d._count._all,
          reviewed: reviewedCount.length,
        }
      })
  )

  // Relationship breakdown across all cycles
  const relBreakdown = await db.reviewAssignment.groupBy({
    by: ['relationship'],
    where: { cycle: { orgId } },
    _count: { _all: true },
  })
  const relSubmitted = await db.reviewAssignment.groupBy({
    by: ['relationship'],
    where: { cycle: { orgId }, submitted: true },
    _count: { _all: true },
  })

  const relSubmittedMap = Object.fromEntries(relSubmitted.map(r => [r.relationship, r._count._all]))
  const relationships = relBreakdown.map(r => ({
    relationship: r.relationship,
    total: r._count._all,
    submitted: relSubmittedMap[r.relationship] ?? 0,
    pct: Math.round(((relSubmittedMap[r.relationship] ?? 0) / r._count._all) * 100),
  }))

  return NextResponse.json({
    totals: { employees: totalEmployees, cycles: totalCycles, active: activeCycles, closed: closedCycles },
    cycleStats,
    deptBreakdown,
    relationships,
  })
}
