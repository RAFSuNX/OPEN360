import { formatDate, formatDateTime } from '@/lib/date'
import { requireOrgAdmin } from '@/lib/org-context'
import { db } from '@/lib/db'
import { getCycle } from '@/lib/services/cycles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminResultsEmployeeList from '@/components/admin/AdminResultsEmployeeList'

export default async function OrgAdminCycleResultsPage({
  params,
}: {
  params: Promise<{ slug: string; cycleId: string }>
}) {
  const { slug, cycleId } = await params
  const { org } = await requireOrgAdmin(slug)

  const cycle = await getCycle(org.id, cycleId)
  if (!cycle) notFound()

  // Get all reviewees and their submission stats
  const assignmentStats = await db.reviewAssignment.groupBy({
    by: ['revieweeId'],
    where: { cycleId },
    _count: { _all: true },
  })
  const submittedStats = await db.reviewAssignment.groupBy({
    by: ['revieweeId'],
    where: { cycleId, submitted: true },
    _count: { _all: true },
  })

  const submittedByReviewee = new Map(submittedStats.map(s => [s.revieweeId, s._count._all]))

  const revieweeIds = assignmentStats.map(s => s.revieweeId)
  const employees = await db.employee.findMany({
    where: { id: { in: revieweeIds }, orgId: org.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, department: true, role: true },
  })

  const employeesWithStats = employees.map(e => ({
    ...e,
    total: assignmentStats.find(s => s.revieweeId === e.id)?._count._all ?? 0,
    submitted: submittedByReviewee.get(e.id) ?? 0,
  }))

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link
          href={`/org/${slug}/admin/results`}
          style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}
        >
          ← All cycles
        </Link>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Results</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
          {cycle.title}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          {cycle.status === 'ACTIVE' ? 'In progress' : cycle.status === 'CLOSED' ? 'Closed' : 'Draft'} ·{' '}
          Ends {formatDate(cycle.endDate)}
        </p>
      </div>

      {employeesWithStats.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            No employees assigned to this cycle yet.{' '}
            <Link href={`/org/${slug}/admin/cycles/${cycleId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Manage cycle
            </Link>
          </p>
        </div>
      ) : (
        <AdminResultsEmployeeList
          employees={employeesWithStats}
          cycleId={cycleId}
          cycleStatus={cycle.status}
          slug={slug}
        />
      )}
    </div>
  )
}
