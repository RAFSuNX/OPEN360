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
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Your profile is not set up yet. Contact your admin.</p>
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
      <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '16px' }}>
          <div>
            <p className="section-label" style={{ marginBottom: '6px' }}>My Profile</p>
            <p style={{ fontSize: '22px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>
              {employee.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>{employee.role ?? 'No role assigned'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            {[
              { label: 'Employee ID', value: employee.employeeId, mono: true },
              { label: 'Department', value: employee.department },
              { label: 'Email', value: employee.email, mono: true },
              { label: 'Manager', value: employee.manager?.name ?? null },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="section-label" style={{ marginBottom: '2px', fontSize: '10px' }}>{label}</p>
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

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
          <p className="section-label">Pending reviews</p>
          {pending.length > 0 && (
            <span style={{
              background: 'var(--primary)', color: 'var(--on-primary)',
              borderRadius: '9999px', padding: '1px 7px', fontSize: '11px', fontWeight: '600',
            }}>{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No pending reviews. You are all caught up.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map(a => (
              <Link key={a.id} href={`/dashboard/review/${a.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  padding: '16px 20px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: 0 }}>
                      Review for {a.reviewee.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      {a.cycle.title}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Due</p>
                    <p style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--body)' }}>
                      {new Date(a.cycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="section-label" style={{ marginBottom: '16px' }}>My results</p>
        {closedCycles.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>No completed cycles yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {closedCycles.map(c => (
              <Link key={c.id} href={`/dashboard/results/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  padding: '16px 20px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: 0 }}>{c.title}</p>
                  <p style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)' }}>
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
