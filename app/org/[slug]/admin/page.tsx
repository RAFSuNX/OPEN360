import { requireOrgAdmin } from '@/lib/org-context'
import { db } from '@/lib/db'

export default async function OrgAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)

  const [employeeCount, cycleCount, activeCount] = await Promise.all([
    db.employee.count({ where: { orgId: org.id, isActive: true } }),
    db.reviewCycle.count({ where: { orgId: org.id } }),
    db.reviewCycle.count({ where: { orgId: org.id, status: 'ACTIVE' } }),
  ])

  const stats = [
    { value: employeeCount, label: 'Active employees' },
    { value: cycleCount,    label: 'Total cycles' },
    { value: activeCount,   label: 'Active cycles' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Overview</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {stats.map(({ value, label }) => (
          <div key={label} className="card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '36px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-1px', margin: '0 0 4px', fontFamily: "'JetBrains Mono', monospace" }}>
              {value}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
