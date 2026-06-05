import { getOrgContext } from '@/lib/org-context'
import { db } from '@/lib/db'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, employee } = await getOrgContext(slug)

  const fullEmployee = await db.employee.findFirst({
    where: { id: employee.id, orgId: org.id },
    include: { manager: { select: { name: true, role: true, email: true } } },
  })

  if (!fullEmployee) return <p>Profile not found.</p>

  const fields = [
    { label: 'Full Name', value: fullEmployee.name, mono: false },
    { label: 'Email', value: fullEmployee.email, mono: true },
    { label: 'Employee ID', value: fullEmployee.employeeId ?? '-', mono: true },
    { label: 'Department', value: fullEmployee.department ?? '-', mono: false },
    { label: 'Role / Title', value: fullEmployee.role ?? '-', mono: false },
    { label: 'Manager', value: fullEmployee.manager?.name ?? '-', mono: false },
    { label: 'Manager Email', value: fullEmployee.manager?.email ?? '-', mono: true },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Account</p>
        <h1 style={{
          fontSize: '26px', fontWeight: '400', color: 'var(--ink)',
          letterSpacing: '-0.3px', margin: 0,
        }}>
          My Profile
        </h1>
      </div>

      <div className="card" style={{ padding: '28px 32px', marginBottom: '24px' }}>
        {/* Avatar + name hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--primary)', color: 'var(--on-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '500', flexShrink: 0,
          }}>
            {fullEmployee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
              {fullEmployee.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              {fullEmployee.role ?? 'No role assigned'}
              {fullEmployee.department ? ` · ${fullEmployee.department}` : ''}
            </p>
          </div>
        </div>

        {/* Fields grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px 32px',
        }}>
          {fields.map(({ label, value, mono }) => (
            <div key={label}>
              <p className="section-label" style={{ marginBottom: '4px', fontSize: '10px' }}>{label}</p>
              <p style={{
                fontSize: '13px', color: value === '-' ? 'var(--muted)' : 'var(--ink)',
                margin: 0,
                fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          To update your profile information, contact your HR administrator.
        </p>
      </div>
    </div>
  )
}
