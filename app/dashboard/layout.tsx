import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrgSettings } from '@/lib/org'
import Link from 'next/link'
import NavLink from '@/components/NavLink'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const org = await getOrgSettings()
  const displayName = org.org_name || 'OPEN360'
  const logoUrl = org.org_logo_url

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <nav style={{
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
        background: 'rgba(247,247,244,0.92)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          {logoUrl
            ? <img src={logoUrl} alt={displayName} style={{ height: '24px', maxWidth: '80px', objectFit: 'contain' }} />
            : <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{displayName}</span>
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto' }}>
          <NavLink href="/dashboard" exact>My Reviews</NavLink>
          {session.user.isAdmin && (
            <Link href="/admin" style={{
              fontSize: '13px', fontWeight: '500', color: 'var(--primary)',
              textDecoration: 'none',
              padding: '5px 10px', borderRadius: '6px',
              border: '1px solid rgba(245,78,0,0.2)',
              transition: 'background 0.12s',
            }}>
              Admin Panel
            </Link>
          )}
          <span className="nav-email" style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
