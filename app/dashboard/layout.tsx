import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <nav style={{
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', letterSpacing: '-0.01em' }}>OPEN360</span>
        </div>
        {session.user.isAdmin && (
          <Link href="/admin" style={{
            fontSize: '13px', fontWeight: '500', color: 'var(--primary)',
            textDecoration: 'none', marginRight: '16px',
          }}>Admin Panel</Link>
        )}
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {session.user.email}
        </span>
      </nav>
      <main style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
