import { requireOrgAdmin } from '@/lib/org-context'
import { db } from '@/lib/db'
import Link from 'next/link'

async function getAnalytics(orgId: string) {
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
    db.employee.groupBy({ by: ['department'], where: { orgId }, _count: { _all: true } }),
    db.reviewCycle.findMany({ where: { orgId }, orderBy: { endDate: 'desc' }, take: 10 }),
  ])

  const cycleStats = await Promise.all(
    recentCycles.map(async (cycle) => {
      const [total, submitted] = await Promise.all([
        db.reviewAssignment.count({ where: { cycleId: cycle.id, NOT: { relationship: 'SELF' } } }),
        db.reviewAssignment.count({ where: { cycleId: cycle.id, submitted: true, NOT: { relationship: 'SELF' } } }),
      ])
      const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
      return { ...cycle, total, submitted, pct }
    })
  )

  const deptBreakdown = await Promise.all(
    departments
      .filter(d => d.department)
      .sort((a, b) => b._count._all - a._count._all)
      .map(async (d) => {
        const empIds = await db.employee.findMany({
          where: { orgId, department: d.department },
          select: { id: true },
        })
        const ids = empIds.map(e => e.id)
        const reviewed = await db.reviewAssignment.groupBy({
          by: ['revieweeId'],
          where: { revieweeId: { in: ids }, submitted: true },
        })
        return { department: d.department!, count: d._count._all, reviewed: reviewed.length }
      })
  )

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
    pct: r._count._all > 0 ? Math.round(((relSubmittedMap[r.relationship] ?? 0) / r._count._all) * 100) : 0,
  }))

  return { totals: { employees: totalEmployees, cycles: totalCycles, active: activeCycles, closed: closedCycles }, cycleStats, deptBreakdown, relationships }
}

const REL_LABELS: Record<string, string> = {
  SELF: 'Self', MANAGER: 'Manager', PEER: 'Peer', DIRECT_REPORT: 'Direct Report',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ padding: '20px 24px', flex: '1 1 160px', minWidth: 0 }}>
      <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '32px', fontWeight: '300', letterSpacing: '-1px', color: 'var(--ink)', margin: '0 0 2px', fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

function PctBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '6px', background: 'var(--hairline)', borderRadius: '9999px', overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '9999px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default async function OrgAdminAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const { totals, cycleStats, deptBreakdown, relationships } = await getAnalytics(org.id)

  const overallTotal = cycleStats.reduce((s, c) => s + c.total, 0)
  const overallSubmitted = cycleStats.reduce((s, c) => s + c.submitted, 0)
  const overallPct = overallTotal > 0 ? Math.round((overallSubmitted / overallTotal) * 100) : 0

  const pctColor = (p: number) => p >= 80 ? 'var(--semantic-success)' : p >= 50 ? 'var(--primary)' : 'var(--muted)'
  const statusColor = (s: string) => s === 'ACTIVE' ? 'var(--primary)' : s === 'CLOSED' ? 'var(--semantic-success)' : 'var(--muted)'

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Admin</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Analytics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
          Organisation-wide review data and participation metrics.
        </p>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard label="Employees" value={totals.employees} />
        <StatCard label="Total Cycles" value={totals.cycles} />
        <StatCard label="Active Cycles" value={totals.active} />
        <StatCard label="Overall Completion" value={`${overallPct}%`} sub={`${overallSubmitted} of ${overallTotal} reviews`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Cycle completion table */}
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>
            Cycle Completion
          </p>
          {cycleStats.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No cycles yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cycleStats.map(c => (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                    <Link
                      href={`/org/${slug}/admin/results/${c.id}`}
                      style={{ fontSize: '13px', color: 'var(--ink)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                    >
                      {c.title}
                    </Link>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: pctColor(c.pct), fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                      {c.pct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <PctBar pct={c.pct} color={pctColor(c.pct)} />
                    <span style={{ fontSize: '10px', color: statusColor(c.status), fontWeight: '600', flexShrink: 0 }}>{c.status}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                    {c.submitted}/{c.total} submitted
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>
            By Department
          </p>
          {deptBreakdown.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No department data.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deptBreakdown.map(d => {
                const pct = d.count > 0 ? Math.round((d.reviewed / d.count) * 100) : 0
                return (
                  <div key={d.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {d.department}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: pctColor(pct), fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {pct}%
                      </span>
                    </div>
                    <PctBar pct={pct} color={pctColor(pct)} />
                    <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                      {d.count} employee{d.count !== 1 ? 's' : ''} · {d.reviewed} reviewed
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Relationship breakdown */}
      {relationships.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 16px', letterSpacing: '-0.2px' }}>
            Reviews by Relationship Type
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {relationships.map(r => (
              <div key={r.relationship}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                  {REL_LABELS[r.relationship] ?? r.relationship}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '28px', fontWeight: '300', letterSpacing: '-0.5px', color: 'var(--ink)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {r.pct}%
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {r.submitted}/{r.total}
                  </span>
                </div>
                <PctBar pct={r.pct} color={pctColor(r.pct)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
