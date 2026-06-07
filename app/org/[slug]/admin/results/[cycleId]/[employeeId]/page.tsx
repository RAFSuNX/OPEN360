import { requireOrgAdmin } from '@/lib/org-context'
import { db } from '@/lib/db'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MyResults from '@/components/dashboard/MyResults'

export default async function OrgAdminEmployeeResultsPage({
  params,
}: {
  params: Promise<{ slug: string; cycleId: string; employeeId: string }>
}) {
  const { slug, cycleId, employeeId } = await params
  const { org } = await requireOrgAdmin(slug)

  const cycle = await getCycle(org.id, cycleId)
  if (!cycle) notFound()

  const employee = await db.employee.findFirst({
    where: { id: employeeId, orgId: org.id },
    select: { id: true, name: true, email: true, department: true, role: true },
  })
  if (!employee) notFound()

  // Admin can see all results (forAdmin=true bypasses anonymity threshold)
  const results = await buildResults(org.id, cycleId, employeeId, true)

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link
          href={`/org/${slug}/admin/results/${cycleId}`}
          style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}
        >
          ← Back to {cycle.title}
        </Link>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Results — Admin View</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
          {employee.name}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          {employee.email}
          {employee.department && <span style={{ marginLeft: '8px' }}>· {employee.department}</span>}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>
          Cycle: {cycle.title}
        </p>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={`/api/admin/results/${cycleId}/${employeeId}/export`}
          style={{
            fontSize: '13px', fontWeight: '500', color: 'var(--ink)',
            textDecoration: 'none', padding: '7px 16px', borderRadius: '8px',
            border: '1px solid var(--hairline)', display: 'inline-block',
          }}
        >
          Export CSV
        </a>
      </div>

      {Object.keys(results).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            No responses submitted yet for this employee.
          </p>
        </div>
      ) : (
        <MyResults results={results} cycleTitle={undefined} />
      )}
    </div>
  )
}
