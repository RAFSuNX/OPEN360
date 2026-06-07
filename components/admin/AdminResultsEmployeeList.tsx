'use client'
import Link from 'next/link'

interface Employee {
  id: string
  name: string
  email: string
  department: string | null
  role: string | null
  total: number
  submitted: number
}

interface Props {
  employees: Employee[]
  cycleId: string
  cycleStatus: string
  slug: string
}

export default function AdminResultsEmployeeList({ employees, cycleId, cycleStatus, slug }: Props) {
  const pctColor = (p: number) =>
    p >= 80 ? 'var(--semantic-success)' : p >= 50 ? 'var(--primary)' : 'var(--muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {employees.map(emp => {
        const pct = emp.total > 0 ? Math.round((emp.submitted / emp.total) * 100) : 0
        const canViewResults = cycleStatus === 'CLOSED'

        return (
          <div key={emp.id} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {emp.name}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  {emp.email}
                  {emp.department && <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>· {emp.department}</span>}
                </p>
              </div>

              <div style={{ width: '140px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{emp.submitted}/{emp.total}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: pctColor(pct), fontFamily: "'JetBrains Mono', monospace" }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--hairline)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pctColor(pct), borderRadius: '9999px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                {canViewResults ? (
                  <Link
                    href={`/org/${slug}/admin/results/${cycleId}/${emp.id}`}
                    style={{
                      fontSize: '13px', fontWeight: '500', color: 'var(--primary)',
                      textDecoration: 'none', padding: '6px 14px', borderRadius: '8px',
                      border: '1px solid rgba(245,78,0,0.3)', display: 'inline-block',
                    }}
                  >
                    View Results
                  </Link>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                    {cycleStatus === 'ACTIVE' ? 'In progress' : 'Draft'}
                  </span>
                )}
                <a
                  href={`/api/admin/results/${cycleId}/${emp.id}/export`}
                  style={{
                    fontSize: '12px', color: 'var(--muted)',
                    textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
                    border: '1px solid var(--hairline)', display: 'inline-block',
                  }}
                >
                  CSV
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
