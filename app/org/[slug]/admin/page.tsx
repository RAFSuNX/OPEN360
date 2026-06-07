import { requireOrgAdmin } from '@/lib/org-context'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function OrgAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)

  const [employeeCount, cycleCount, activeCount, activeCycles, recentAudit] = await Promise.all([
    db.employee.count({ where: { orgId: org.id, isActive: true } }),
    db.reviewCycle.count({ where: { orgId: org.id } }),
    db.reviewCycle.count({ where: { orgId: org.id, status: 'ACTIVE' } }),
    db.reviewCycle.findMany({
      where: { orgId: org.id, status: 'ACTIVE' },
      orderBy: { endDate: 'asc' },
      take: 5,
    }),
    db.auditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // For each active cycle get submission stats
  const activeCycleStats = await Promise.all(
    activeCycles.map(async cycle => {
      const [total, submitted] = await Promise.all([
        db.reviewAssignment.count({ where: { cycleId: cycle.id, NOT: { relationship: 'SELF' } } }),
        db.reviewAssignment.count({ where: { cycleId: cycle.id, submitted: true, NOT: { relationship: 'SELF' } } }),
      ])
      const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
      const daysLeft = Math.ceil((new Date(cycle.endDate).getTime() - Date.now()) / 86400000)
      return { ...cycle, total, submitted, pct, daysLeft }
    })
  )

  const stats = [
    { value: employeeCount, label: 'Active employees', href: `admin/employees` },
    { value: cycleCount, label: 'Total cycles', href: `admin/cycles` },
    { value: activeCount, label: 'Active cycles', href: `admin/cycles`, highlight: activeCount > 0 },
  ]

  const pctColor = (p: number) =>
    p >= 80 ? 'var(--semantic-success)' : p >= 50 ? 'var(--primary)' : 'var(--muted)'

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Overview</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {stats.map(({ value, label, href, highlight }) => (
          <Link key={label} href={`/org/${slug}/${href}`} style={{ textDecoration: 'none' }}>
            <div className="card card-interactive" style={{ padding: '20px 24px' }}>
              <p style={{
                fontSize: '36px', fontWeight: '400', letterSpacing: '-1px', margin: '0 0 4px',
                fontFamily: "'JetBrains Mono', monospace",
                color: highlight ? 'var(--primary)' : 'var(--ink)',
              }}>
                {value}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Active cycles progress */}
      {activeCycleStats.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <p className="section-label" style={{ marginBottom: '16px' }}>Active cycle progress</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeCycleStats.map(cycle => (
              <Link key={cycle.id} href={`/org/${slug}/admin/cycles/${cycle.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-interactive" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {cycle.title}
                      </p>
                      <p style={{ fontSize: '12px', color: cycle.daysLeft <= 3 ? 'var(--semantic-error)' : 'var(--muted)', margin: 0 }}>
                        {cycle.daysLeft > 0 ? `${cycle.daysLeft} day${cycle.daysLeft !== 1 ? 's' : ''} left` : 'Ending today'}
                      </p>
                    </div>
                    <div style={{ width: '160px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{cycle.submitted}/{cycle.total}</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", color: pctColor(cycle.pct) }}>
                          {cycle.pct}%
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--hairline)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${cycle.pct}%`, background: pctColor(cycle.pct), borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section style={{ marginBottom: '40px' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>Quick actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Add employees', sub: 'Invite via CSV or form', href: `admin/employees` },
            { label: 'New review cycle', sub: 'Schedule a 360 review', href: `admin/cycles` },
            { label: 'Manage templates', sub: 'Edit question sets', href: `admin/templates` },
            { label: 'View results', sub: 'Analyse feedback data', href: `admin/results` },
          ].map(item => (
            <Link key={item.label} href={`/org/${slug}/${item.href}`} style={{ textDecoration: 'none' }}>
              <div className="card card-interactive" style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent audit log */}
      {recentAudit.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p className="section-label">Recent activity</p>
            <Link href={`/org/${slug}/admin/settings`} style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
              Full audit log →
            </Link>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {recentAudit.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', gap: '16px', padding: '10px 16px', alignItems: 'center',
                borderBottom: i < recentAudit.length - 1 ? '1px solid var(--hairline)' : 'none',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
                <span style={{
                  fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                  background: 'var(--surface-strong)', padding: '2px 8px',
                  borderRadius: '4px', color: 'var(--ink)', flexShrink: 0,
                }}>
                  {log.action}
                </span>
                {log.target && (
                  <span style={{ fontSize: '12px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {log.target}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
