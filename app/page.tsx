import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrgSettings, isOnboardingComplete } from '@/lib/org'
import Link from 'next/link'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

  // Logged-in users get routed to their org
  if (session?.user?.email) {
    const employee = await db.employee.findFirst({
      where: { email: session.user.email, isActive: true },
      include: { org: { select: { slug: true } } },
    })
    if (employee) {
      const slug = employee.org.slug
      if (employee.isAdmin) {
        const org = await getOrgSettings(employee.orgId)
        if (!isOnboardingComplete(org)) redirect(`/org/${slug}/onboarding`)
        redirect(`/org/${slug}/admin`)
      }
      redirect(`/org/${slug}/dashboard`)
    }
    redirect('/signup')
  }

  // Public homepage
  return <HomePage />
}

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: '360-degree reviews',
    body: 'Collect feedback from managers, peers, and direct reports in one structured cycle.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Multi-tenant workspaces',
    body: 'Every organization gets its own isolated workspace with custom branding and settings.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    title: 'Question templates',
    body: 'Build reusable templates with rating scales and open-text questions for consistent reviews.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
      </svg>
    ),
    title: 'Anonymous results',
    body: 'Responses are anonymized below your configured threshold. Employees see aggregated feedback only.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    title: 'Email notifications',
    body: 'Automated invites, reminders, and results-ready emails keep everyone on track.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Encrypted by default',
    body: 'Review responses are encrypted at rest with AES-256. Your data stays private.',
  },
]

const steps = [
  { n: '01', title: 'Create your workspace', body: 'Sign up with your work email. Your organization is ready in seconds.' },
  { n: '02', title: 'Add your team', body: 'Import employees, set manager relationships, configure your org hierarchy.' },
  { n: '03', title: 'Launch a review cycle', body: 'Pick a template, set dates, auto-assign reviewers by hierarchy, and send.' },
  { n: '04', title: 'View results', body: 'Employees and admins see anonymized aggregated feedback and ratings.' },
]

function HomePage() {
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--hairline)',
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(247,247,244,0.92)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', background: 'var(--primary)', borderRadius: '6px', flexShrink: 0 }} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', letterSpacing: '-0.02em' }}>OPEN360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/login" style={{ fontSize: '13px', color: 'var(--body)', textDecoration: 'none', padding: '6px 12px' }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '8px' }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '820px', margin: '0 auto', padding: '100px 32px 80px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(245,78,0,0.07)', border: '1px solid rgba(245,78,0,0.15)',
          borderRadius: '9999px', padding: '4px 12px', marginBottom: '32px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.04em' }}>
            OPEN SOURCE · FREE TO START
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(38px, 6vw, 64px)',
          fontWeight: '400',
          color: 'var(--ink)',
          letterSpacing: '-2px',
          lineHeight: '1.08',
          margin: '0 0 24px',
        }}>
          360-degree employee reviews,{' '}
          <span style={{ color: 'var(--primary)' }}>done right.</span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--body)',
          lineHeight: '1.6',
          maxWidth: '560px',
          margin: '0 auto 40px',
        }}>
          OPEN360 is a self-hostable, multi-tenant performance review platform.
          Set up your organization, run structured 360 cycles, and deliver anonymous feedback to your team.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '15px', padding: '11px 28px', borderRadius: '10px' }}>
            Create your workspace
          </Link>
          <Link href="https://github.com/RAFSuNX/OPEN360" target="_blank" rel="noopener" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', color: 'var(--body)', textDecoration: 'none',
            padding: '11px 20px', border: '1px solid var(--hairline-strong)',
            borderRadius: '10px', background: 'var(--surface-card)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            View on GitHub
          </Link>
        </div>
      </section>

      {/* Social proof strip */}
      <section style={{ borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)', padding: '20px 32px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {[
            { value: '360°', label: 'Feedback coverage' },
            { value: 'AES-256', label: 'Encrypted responses' },
            { value: 'MIT', label: 'Open source license' },
            { value: 'Multi-tenant', label: 'Org isolation' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 2px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.5px' }}>{value}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px' }}>
        <p className="section-label" style={{ textAlign: 'center', marginBottom: '12px' }}>Features</p>
        <h2 style={{ fontSize: '32px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.8px', textAlign: 'center', margin: '0 0 48px' }}>
          Everything you need to run reviews
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {features.map(({ icon, title, body }) => (
            <div key={title} className="card" style={{ padding: '24px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '14px' }}>{icon}</div>
              <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 8px' }}>{title}</p>
              <p style={{ fontSize: '13px', color: 'var(--body)', margin: 0, lineHeight: '1.6' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)', padding: '80px 32px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <p className="section-label" style={{ textAlign: 'center', marginBottom: '12px' }}>How it works</p>
          <h2 style={{ fontSize: '32px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.8px', textAlign: 'center', margin: '0 0 48px' }}>
            Up and running in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
            {steps.map(({ n, title, body }) => (
              <div key={n}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--primary)', fontWeight: '600', margin: '0 0 10px', letterSpacing: '0.06em' }}>{n}</p>
                <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 8px' }}>{title}</p>
                <p style={{ fontSize: '13px', color: 'var(--body)', margin: 0, lineHeight: '1.6' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: '820px', margin: '0 auto', padding: '80px 32px' }}>
        <p className="section-label" style={{ textAlign: 'center', marginBottom: '12px' }}>Pricing</p>
        <h2 style={{ fontSize: '32px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.8px', textAlign: 'center', margin: '0 0 48px' }}>
          Simple, honest pricing
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            {
              plan: 'Free',
              price: '$0',
              period: 'forever',
              features: ['Up to 10 employees', 'Unlimited review cycles', 'All question types', 'Email notifications', 'Anonymous feedback', 'Community support'],
              cta: 'Get started free',
              href: '/signup',
              highlight: false,
            },
            {
              plan: 'Pro',
              price: '$29',
              period: 'per month',
              features: ['Unlimited employees', 'Everything in Free', 'Priority support', 'Advanced analytics', 'Custom branding', 'SSO (coming soon)'],
              cta: 'Start Pro trial',
              href: '/signup?plan=PRO',
              highlight: true,
            },
          ].map(({ plan, price, period, features: fs, cta, href, highlight }) => (
            <div key={plan} className="card" style={{
              padding: '28px 24px',
              border: highlight ? '2px solid var(--primary)' : '1px solid var(--hairline)',
              position: 'relative',
            }}>
              {highlight && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: '700',
                  letterSpacing: '0.08em', padding: '3px 12px', borderRadius: '9999px',
                }}>
                  MOST POPULAR
                </div>
              )}
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 6px' }}>{plan}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                <span style={{ fontSize: '36px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-1.5px', fontFamily: "'JetBrains Mono', monospace" }}>{price}</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>/{period}</span>
              </div>
              <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0 }}>
                {fs.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--body)', marginBottom: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={href} className={highlight ? 'btn-primary' : 'btn-secondary'} style={{ display: 'block', textAlign: 'center', fontSize: '14px', padding: '10px', borderRadius: '8px', textDecoration: 'none' }}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--ink)', padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '400', color: 'white', letterSpacing: '-1px', margin: '0 0 16px' }}>
          Ready to run better reviews?
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: '0 0 32px' }}>
          Free to start. No credit card required.
        </p>
        <Link href="/signup" style={{
          display: 'inline-block', background: 'var(--primary)', color: 'white',
          fontSize: '15px', fontWeight: '500', padding: '12px 32px',
          borderRadius: '10px', textDecoration: 'none',
        }}>
          Create your workspace
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--hairline)', padding: '28px 32px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: 'var(--primary)', borderRadius: '5px' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>OPEN360</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>MIT License</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: 'GitHub', href: 'https://github.com/RAFSuNX/OPEN360' },
              { label: 'Sign in', href: '/login' },
              { label: 'Sign up', href: '/signup' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
