import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function AdminHomePage() {
  await requireAdmin()

  const [employeeCount, cycleCount, activeCount] = await Promise.all([
    db.employee.count({ where: { isActive: true } }),
    db.reviewCycle.count(),
    db.reviewCycle.count({ where: { status: 'ACTIVE' } }),
  ])

  const stats = [
    { value: employeeCount, label: 'Active employees' },
    { value: cycleCount, label: 'Total cycles' },
    { value: activeCount, label: 'Active cycles' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Overview</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', maxWidth: '600px' }}>
        {stats.map(({ value, label }) => (
          <div key={label} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.5px', fontFamily: "'JetBrains Mono', monospace" }}>
              {value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
