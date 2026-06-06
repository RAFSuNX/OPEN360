import { requireOrgAdmin } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import NavLink from '@/components/NavLink'
import Link from 'next/link'

const navItems = [
  { href: 'admin',           label: 'Overview', exact: true },
  { href: 'admin/employees', label: 'Employees' },
  { href: 'admin/cycles',    label: 'Cycles' },
  { href: 'admin/results',   label: 'Results' },
  { href: 'admin/questions', label: 'Questions' },
  { href: 'admin/templates', label: 'Templates' },
  { href: 'admin/settings',  label: 'Settings' },
]

export default async function OrgAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, session } = await requireOrgAdmin(slug)
  const settings = await getOrgSettings(org.id)
  const displayName = settings.org_name || org.name
  const logoUrl = settings.org_logo_url

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <nav style={{
        background: 'var(--ink)',
        borderBottom: '1px solid var(--hairline)',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
          {logoUrl
            ? <img src={logoUrl} alt={displayName} style={{ height: '24px', maxWidth: '80px', objectFit: 'contain' }} />
            : <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--on-dark)', letterSpacing: '-0.01em' }}>
            {displayName}
          </span>
        </div>

        <div className="nav-links nav-dark" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflow: 'hidden' }}>
          {navItems.map(({ href, label, exact }) => (
            <NavLink key={href} href={`/org/${slug}/${href}`} exact={exact}>{label}</NavLink>
          ))}
        </div>

        <div style={{ textAlign: 'right' as const }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
            {session.user.email}
          </p>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--primary)', margin: 0 }}>
            Admin
          </p>
        </div>
      </nav>

      <main style={{ padding: 'var(--page-padding)', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
