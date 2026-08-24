import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function OrgsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const memberships = await db.employee.findMany({
    where: { email: session.user.email, isActive: true },
    include: { org: { select: { id: true, name: true, slug: true, plan: true } } },
    orderBy: { org: { createdAt: 'asc' } },
  })

  // 0 memberships with an active session = stale JWT from a wiped/old DB.
  // Sign out to clear the token so the user can start fresh.
  if (memberships.length === 0) redirect('/api/auth/signout?callbackUrl=/signup')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={{ background: '#1c1208', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          OPEN<span style={{ color: 'var(--primary)' }}>360</span>
        </span>
        <Link href="/api/auth/signout" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
          Sign out
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '56px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%' }}>
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Your workspaces</p>
            <h1 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: '1.1', margin: '0 0 6px' }}>
              Choose a workspace
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0 }}>
              You have access to {memberships.length} workspace{memberships.length > 1 ? 's' : ''}.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {memberships.map(m => (
              <Link
                key={m.org.id}
                href={m.isAdmin ? `/org/${m.org.slug}/admin` : `/org/${m.org.slug}/dashboard`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 3px' }}>
                      {m.org.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                      /org/{m.org.slug}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '9999px',
                      background: m.isAdmin ? 'rgba(245,78,0,0.1)' : 'var(--surface-strong)',
                      color: m.isAdmin ? 'var(--primary)' : 'var(--muted)',
                    }}>
                      {m.isAdmin ? 'Admin' : 'Member'}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '9999px',
                      background: m.org.plan === 'EXTENDED' ? 'var(--primary)' : 'var(--surface-strong)',
                      color: m.org.plan === 'EXTENDED' ? 'white' : 'var(--muted)',
                      letterSpacing: '0.06em',
                    }}>
                      {m.org.plan}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/orgs/new"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create new workspace
          </Link>
        </div>
      </div>
    </div>
  )
}
