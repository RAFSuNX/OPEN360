import { getOrgContext } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import { db } from '@/lib/db'
import NavLink from '@/components/NavLink'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

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

  const pendingCount = await db.reviewAssignment.count({
    where: {
      reviewerId: employee.id,
      submitted: false,
      cycle: { status: 'ACTIVE', orgId: org.id },
    },
  })

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
          <Link href="/orgs" style={{ textDecoration: 'none' }}>
            {logoUrl
              ? <img src={logoUrl} alt={displayName} style={{ height: '18px', maxWidth: '72px', objectFit: 'contain' }} />
              : <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.55)' }}>{displayName}</span>
            }
          </Link>
        </div>

        {/* Nav links */}
        <div className="nav-links nav-dark" style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflow: 'hidden' }}>
          <NavLink href={`/org/${slug}/dashboard`} exact>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              My Reviews
              {pendingCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', borderRadius: '9999px',
                  background: 'var(--primary)', color: 'var(--on-primary)',
                  fontSize: '10px', fontWeight: '700', padding: '0 4px',
                }}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </span>
          </NavLink>
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

        {/* User + switch org */}
        <div style={{ flexShrink: 0, marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="nav-email" style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', display: 'block',
          }}>
            {session.user.email}
          </span>
          <Link href="/orgs" title="Switch workspace" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
            padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
            </svg>
            Switch
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <main style={{ padding: 'var(--page-padding)', maxWidth: '900px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
