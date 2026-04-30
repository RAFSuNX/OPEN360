import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrgSettings } from '@/lib/org'
import NavLink from '@/components/NavLink'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  const org = await getOrgSettings()
  const displayName = org.org_name || 'OPEN360'
  const logoUrl = org.org_logo_url

  const navItems = [
    { href: '/admin', label: 'Overview', exact: true },
    { href: '/admin/employees', label: 'Employees' },
    { href: '/admin/cycles', label: 'Cycles' },
    { href: '/admin/questions', label: 'Questions' },
    { href: '/admin/templates', label: 'Templates' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <nav style={{
        background: 'rgba(247,247,244,0.92)',
        borderBottom: '1px solid var(--hairline)',
        minHeight: '56px',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '28px' }}>
          {logoUrl
            ? <img src={logoUrl} alt={displayName} style={{ height: '24px', maxWidth: '80px', objectFit: 'contain' }} />
            : <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{displayName}</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflow: 'hidden' }}>
          {navItems.map(({ href, label, exact }) => (
            <NavLink key={href} href={href} exact={exact}>{label}</NavLink>
          ))}
        </div>
        <div className="nav-email" style={{ textAlign: 'right' as const }}>
          <p style={{ fontSize: '12px', color: 'var(--ink)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{session.user.email}</p>
          <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--primary)', margin: 0 }}>Admin</p>
        </div>
      </nav>
      <main style={{ padding: 'var(--page-padding)', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
