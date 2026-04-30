import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const employee = await db.employee.findUnique({
    where: { email: session.user.email },
    include: { manager: { select: { name: true, role: true } } },
  })
  if (!employee) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '64px 48px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--hairline-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 4px' }}>Profile not set up</p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Contact your admin to get access.</p>
      </div>
    )
  }

  const [pending, closedCycles] = await Promise.all([
    db.reviewAssignment.findMany({
      where: { reviewerId: employee.id, submitted: false, cycle: { status: 'ACTIVE' } },
      include: {
        reviewee: { select: { name: true } },
        cycle: { select: { title: true, endDate: true } },
      },
    }),
    db.reviewCycle.findMany({
      where: { status: 'CLOSED', assignments: { some: { revieweeId: employee.id } } },
      orderBy: { endDate: 'desc' },
    }),
  ])

  return (
    <div>
      {/* Profile card */}
      <div className="card stagger-item" style={{ marginBottom: '32px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '20px' }}>
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>My Profile</p>
            <p style={{ fontSize: '24px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.4px', margin: '0 0 4px' }}>
              {employee.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{employee.role ?? 'No role assigned'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {[
              { label: 'Employee ID', value: employee.employeeId, mono: true },
              { label: 'Department', value: employee.department },
              { label: 'Email', value: employee.email, mono: true },
              { label: 'Manager', value: employee.manager?.name ?? null },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="section-label" style={{ marginBottom: '3px', fontSize: '10px' }}>{label}</p>
                <p style={{
                  fontSize: '13px', margin: 0,
                  color: value ? 'var(--ink)' : 'var(--muted)',
                  fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
                }}>{value ?? '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending reviews */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <p className="section-label">Pending reviews</p>
          {pending.length > 0 && (
            <span style={{
              background: 'var(--primary)', color: 'var(--on-primary)',
              borderRadius: '9999px', padding: '1px 8px', fontSize: '11px', fontWeight: '600',
            }}>{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
            <div style={{ width: '32px', height: '32px', background: '#d1f0e7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8a65" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>All caught up - no pending reviews.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map((a, i) => {
              const daysLeft = Math.ceil((new Date(a.cycle.endDate).getTime() - Date.now()) / 86400000)
              const urgent = daysLeft <= 2
              return (
                <Link key={a.id} href={`/dashboard/review/${a.id}`} style={{ textDecoration: 'none' }} className="stagger-item">
                  <div className="card card-interactive" style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderLeft: urgent ? '3px solid var(--primary)' : '1px solid var(--hairline)',
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px' }}>
                        Review for {a.reviewee.name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                        {a.cycle.title}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      <p style={{ fontSize: '11px', color: urgent ? 'var(--primary)' : 'var(--muted)', margin: '0 0 2px', fontWeight: urgent ? '600' : '400' }}>
                        {daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft}d left`}
                      </p>
                      <p style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--body)', margin: 0 }}>
                        {new Date(a.cycle.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* My results */}
      <section>
        <p className="section-label" style={{ marginBottom: '16px' }}>My results</p>
        {closedCycles.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--muted)', padding: '20px 0' }}>No completed cycles yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {closedCycles.map((c, i) => (
              <Link key={c.id} href={`/dashboard/results/${c.id}`} style={{ textDecoration: 'none' }} className="stagger-item">
                <div className="card card-interactive" style={{
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--semantic-success)', flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: 0 }}>{c.title}</p>
                  </div>
                  <p style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)', margin: 0 }}>
                    {new Date(c.endDate).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
