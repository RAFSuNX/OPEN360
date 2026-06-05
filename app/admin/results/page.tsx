import { requireAdmin } from '@/lib/auth'
import { listCycles } from '@/lib/services/cycles'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminResultsIndexPage() {
  await requireAdmin()

  const cycles = await listCycles()

  const cycleStats = await Promise.all(
    cycles.map(async cycle => {
      const [total, submitted, revieweeCount] = await Promise.all([
        db.reviewAssignment.count({ where: { cycleId: cycle.id, NOT: { relationship: 'SELF' } } }),
        db.reviewAssignment.count({ where: { cycleId: cycle.id, submitted: true, NOT: { relationship: 'SELF' } } }),
        db.reviewAssignment.groupBy({
          by: ['revieweeId'],
          where: { cycleId: cycle.id },
          _count: true,
        }).then(r => r.length),
      ])
      const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
      return { ...cycle, total, submitted, pct, revieweeCount }
    })
  )

  const statusColor = (status: string) => {
    if (status === 'ACTIVE') return 'var(--primary)'
    if (status === 'CLOSED') return 'var(--semantic-success)'
    return 'var(--muted)'
  }

  const pctColor = (pct: number) => {
    if (pct >= 80) return 'var(--semantic-success)'
    if (pct >= 50) return 'var(--primary)'
    return 'var(--muted)'
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Admin</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Results
        </h1>
      </div>

      {cycleStats.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No cycles yet. Create one from the Cycles page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cycleStats.map(cycle => (
            <Link
              key={cycle.id}
              href={`/admin/results/${cycle.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-interactive" style={{ padding: '18px 24px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Status dot */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: statusColor(cycle.status), flexShrink: 0,
                  }} />

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cycle.title}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                      {cycle.revieweeCount} employee{cycle.revieweeCount !== 1 ? 's' : ''} · {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '160px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{cycle.submitted}/{cycle.total} submitted</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: pctColor(cycle.pct), fontFamily: "'JetBrains Mono', monospace" }}>{cycle.pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--hairline)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${cycle.pct}%`,
                        background: pctColor(cycle.pct),
                        borderRadius: '9999px',
                      }} />
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="badge" style={{
                    fontSize: '10px', flexShrink: 0,
                    color: statusColor(cycle.status),
                    borderColor: statusColor(cycle.status),
                  }}>
                    {cycle.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
