import { requireAdmin } from '@/lib/auth'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import { db } from '@/lib/db'
import { getOrgSettings } from '@/lib/org'
import MyResults from '@/components/dashboard/MyResults'
import { ExportButton } from '@/components/admin/ExportButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AdminResultsPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>
}) {
  await requireAdmin()
  const { cycleId, employeeId } = await params

  const [cycle, employee, org] = await Promise.all([
    getCycle(cycleId),
    db.employee.findUnique({ where: { id: employeeId }, select: { id: true, name: true, email: true, role: true, employeeId: true, department: true } }),
    getOrgSettings(),
  ])

  if (!cycle || !employee) notFound()

  const results = await buildResults(cycleId, employeeId, true)

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link href={`/admin/cycles/${cycleId}`} style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Back to {cycle.title}
        </Link>
      </div>
      <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--surface-strong)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: 'var(--ink)', flexShrink: 0 }}>
          {employee.name.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 2px' }}>{employee.name}</p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{employee.email}</p>
        </div>
        <span className="badge" style={{ marginLeft: 'auto' }}>{cycle.title}</span>
        <ExportButton
          cycleId={cycleId} employeeId={employeeId}
          employeeName={employee.name} cycleTitle={cycle.title}
          employeeEmail={employee.email}
          employeeIdCode={employee.employeeId ?? undefined}
          employeeRole={employee.role ?? undefined}
          employeeDepartment={employee.department ?? undefined}
          orgName={org.org_name || undefined}
          orgLogoApiUrl={org.org_logo_email ? `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/logo` : undefined}
        />
      </div>
      <MyResults results={results} />
    </div>
  )
}
