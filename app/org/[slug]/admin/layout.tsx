import { requireOrgAdmin } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import NavLink from '@/components/NavLink'
import Link from 'next/link'

const navItems = [
  { href: 'admin',             label: 'Overview', exact: true },
  { href: 'admin/employees',   label: 'Employees' },
  { href: 'admin/cycles',      label: 'Cycles' },
  { href: 'admin/results',     label: 'Results' },
  { href: 'admin/analytics',   label: 'Analytics' },
  { href: 'admin/questions',   label: 'Questions' },
  { href: 'admin/templates',   label: 'Templates' },
  { href: 'admin/settings',    label: 'Settings' },
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
        background: '#1c1208',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: '0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo + org */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, marginRight: '28px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            OPEN<span style={{ color: 'var(--primary)' }}>360</span>
          </span>
          <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />
          <Link href="/orgs" style={{ textDecoration: 'none' }}>
            {logoUrl
              ? <img src={logoUrl} alt={displayName} style={{ height: '18px', maxWidth: '72px', objectFit: 'contain' }} />
              : <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.55)' }}>{displayName}</span>
            }
          </Link>
        </div>

        {/* Nav links — scrollable so they never hide behind the user badge */}
        <div className="nav-links nav-dark" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {navItems.map(({ href, label, exact }) => (
            <NavLink key={href} href={`/org/${slug}/${href}`} exact={exact}>{label}</NavLink>
          ))}
        </div>

        {/* User */}
        <div style={{ flexShrink: 0, textAlign: 'right' as const, marginLeft: '16px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
            {session.user.email}
          </p>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--primary)', margin: 0 }}>
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
