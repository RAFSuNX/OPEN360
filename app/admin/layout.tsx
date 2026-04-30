import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/employees', label: 'Employees' },
    { href: '/admin/cycles', label: 'Cycles' },
    { href: '/admin/questions', label: 'Questions' },
  ]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
          <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '5px', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', letterSpacing: '-0.01em' }}>OPEN360</span>
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginLeft: '2px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href} className="nav-link" style={{ padding: '6px 10px', borderRadius: '6px' }}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {session.user.email}
        </span>
      </nav>
      <main style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
