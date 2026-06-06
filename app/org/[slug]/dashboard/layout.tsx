import { getOrgContext } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import NavLink from '@/components/NavLink'
import Link from 'next/link'

export default async function OrgDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, employee, session } = await getOrgContext(slug)
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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              OPEN<span style={{ color: 'var(--primary)' }}>360</span>
            </span>
          </Link>
          <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />
          {logoUrl
            ? <img src={logoUrl} alt={displayName} style={{ height: '18px', maxWidth: '72px', objectFit: 'contain' }} />
            : <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.55)' }}>{displayName}</span>
          }
        </div>

        {/* Nav links */}
        <div className="nav-links nav-dark" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflow: 'hidden' }}>
          <NavLink href={`/org/${slug}/dashboard`} exact>My Reviews</NavLink>
          <NavLink href={`/org/${slug}/dashboard/profile`}>Profile</NavLink>
          {employee.isAdmin && (
            <Link href={`/org/${slug}/admin`} style={{
              fontSize: '13px', fontWeight: '500', color: 'var(--primary)',
              textDecoration: 'none', padding: '5px 12px', borderRadius: '28px',
              border: '1px solid rgba(245,78,0,0.3)',
              marginLeft: '4px',
              transition: 'border-color 0.15s',
            }}>
              Admin Panel
            </Link>
          )}
        </div>

        {/* User email */}
        <div style={{ flexShrink: 0, marginLeft: '16px' }}>
          <span className="nav-email" style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', display: 'block',
          }}>
            {session.user.email}
          </span>
        </div>
      </nav>

      <main style={{ padding: 'var(--page-padding)', maxWidth: '900px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
