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
        background: '#1c1208',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          {logoUrl
            ? <img src={logoUrl} alt={displayName} style={{ height: '24px', maxWidth: '80px', objectFit: 'contain' }} />
            : <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--on-dark)', letterSpacing: '-0.01em' }}>
            {displayName}
          </span>
        </div>

        <div className="nav-links nav-dark" style={{ display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto' }}>
          <NavLink href={`/org/${slug}/dashboard`} exact>My Reviews</NavLink>
          <NavLink href={`/org/${slug}/dashboard/profile`}>Profile</NavLink>

          {employee.isAdmin && (
            <Link href={`/org/${slug}/admin`} style={{
              fontSize: '13px', fontWeight: '500', color: 'var(--primary)',
              textDecoration: 'none', padding: '5px 10px', borderRadius: '32px',
              border: '1px solid rgba(230,0,0,0.3)',
            }}>
              Admin Panel
            </Link>
          )}

          <span className="nav-email" style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
