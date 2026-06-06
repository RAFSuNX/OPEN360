import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrgSettings, isOnboardingComplete } from '@/lib/org'
import Link from 'next/link'

export default async function RootPage() {
  const session = await getServerSession(authOptions)

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

  return <HomePage />
}

const features = [
  {
    title: '360-degree reviews',
    body: 'Collect feedback from managers, peers, and direct reports in one structured cycle.',
  },
  {
    title: 'Multi-tenant workspaces',
    body: 'Every organization gets its own isolated workspace with custom branding and settings.',
  },
  {
    title: 'Question templates',
    body: 'Build reusable templates with rating scales and open-text questions for consistent reviews.',
  },
  {
    title: 'Anonymous results',
    body: 'Responses anonymized below your threshold. Employees see aggregated feedback only.',
  },
  {
    title: 'Email notifications',
    body: 'Automated invites, reminders, and results-ready emails keep everyone on track.',
  },
  {
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
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)', fontFamily: "'Geist', 'Helvetica Neue', Arial, sans-serif" }}>

      {/* ─── Nav ─── */}
      <nav style={{
        background: 'var(--ink)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Speechmark orb */}
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--primary)',
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>OPEN360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/login" style={{ fontSize: '16px', fontWeight: '400', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.15s' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            fontSize: '16px', fontWeight: '400', color: 'white',
            textDecoration: 'none', padding: '8px 20px',
            background: 'var(--primary)', borderRadius: '60px',
            border: '1px solid var(--primary)',
            transition: 'background 0.15s',
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ─── Hero Band (Dark) ─── */}
      <section style={{
        background: 'var(--ink)',
        padding: '80px 32px 96px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle red glow bottom-right */}
        <div style={{
          position: 'absolute', bottom: '-60px', right: '-60px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(230,0,0,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0', margin: '0 0 24px' }}>
            Open Source · Free to Start
          </p>

          {/* Massive headline */}
          <h1 style={{
            fontSize: 'clamp(52px, 8vw, 120px)',
            fontWeight: '800',
            color: 'white',
            lineHeight: '0.96',
            letterSpacing: '-2px',
            margin: '0 0 40px',
            textTransform: 'uppercase',
            maxWidth: '900px',
          }}>
            PERFORMANCE<br />
            <span style={{ color: 'var(--primary)' }}>REVIEWS,</span><br />
            DONE RIGHT.
          </h1>

          <p style={{ fontSize: '20px', fontWeight: '400', color: 'rgba(255,255,255,0.65)', lineHeight: '1.55', maxWidth: '540px', margin: '0 0 48px' }}>
            Self-hostable, multi-tenant 360-degree review platform.
            Set up your organization, run structured cycles, deliver anonymous feedback.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              fontSize: '18px', fontWeight: '400', color: 'white',
              textDecoration: 'none', padding: '12px 28px',
              background: 'var(--primary)', borderRadius: '60px',
              border: '1px solid var(--primary)', transition: 'background 0.15s',
              display: 'inline-block',
            }}>
              Create your workspace
            </Link>
            <Link href="https://github.com/RAFSuNX/OPEN360" target="_blank" rel="noopener" style={{
              fontSize: '18px', fontWeight: '400', color: 'white',
              textDecoration: 'none', padding: '12px 28px',
              background: 'transparent', borderRadius: '60px',
              border: '1px solid white',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Band (Light) ─── */}
      <section style={{ background: 'var(--canvas-soft)', padding: '32px', borderTop: '1px solid var(--hairline)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' }}>
          {[
            { value: '360°', label: 'Feedback coverage' },
            { value: 'AES-256', label: 'Encrypted responses' },
            { value: 'MIT', label: 'Open source' },
            { value: 'Multi-tenant', label: 'Org isolation' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{value}</p>
              <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.57px' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Band (Light) ─── */}
      <section style={{ background: 'var(--canvas)', padding: '88px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', margin: '0 0 16px' }}>Features</p>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '300', color: 'var(--ink)', letterSpacing: '-1px', lineHeight: '1.1', margin: '0 0 56px', maxWidth: '700px' }}>
            Everything you need to run great reviews
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0', border: '1px solid var(--hairline)' }}>
            {features.map(({ title, body }, i) => (
              <div key={title} style={{
                padding: '32px',
                borderRight: i % 3 !== 2 ? '1px solid var(--hairline)' : 'none',
                borderBottom: i < 3 ? '1px solid var(--hairline)' : 'none',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginBottom: '20px' }} />
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 10px', lineHeight: '1.3' }}>{title}</p>
                <p style={{ fontSize: '16px', fontWeight: '400', color: 'var(--body)', margin: 0, lineHeight: '1.6' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works Band (Soft) ─── */}
      <section style={{ background: 'var(--canvas-soft)', borderTop: '1px solid var(--hairline)', padding: '88px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '300', color: 'var(--ink)', letterSpacing: '-1px', lineHeight: '1.1', margin: '0 0 64px' }}>
            Up and running in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '48px' }}>
            {steps.map(({ n, title, body }) => (
              <div key={n}>
                <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.57px' }}>{n}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 10px', lineHeight: '1.2' }}>{title}</p>
                <p style={{ fontSize: '16px', fontWeight: '400', color: 'var(--body)', margin: 0, lineHeight: '1.6' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Band (Light) ─── */}
      <section style={{ background: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '88px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', margin: '0 0 16px' }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '300', color: 'var(--ink)', letterSpacing: '-1px', lineHeight: '1.1', margin: '0 0 56px' }}>
            Simple, honest pricing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '720px' }}>
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
              <div key={plan} style={{
                background: highlight ? 'var(--ink)' : 'var(--canvas-soft)',
                borderRadius: '6px',
                padding: '32px',
                position: 'relative',
              }}>
                {highlight && (
                  <span style={{
                    position: 'absolute', top: '20px', right: '20px',
                    fontSize: '12px', fontWeight: '600', color: 'white',
                    background: 'var(--primary)', borderRadius: '32px',
                    padding: '3px 12px', textTransform: 'uppercase', letterSpacing: '0.57px',
                  }}>
                    Popular
                  </span>
                )}
                <p style={{ fontSize: '14px', fontWeight: '800', color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--body)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.57px' }}>{plan}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                  <span style={{ fontSize: '56px', fontWeight: '800', color: highlight ? 'white' : 'var(--ink)', letterSpacing: '-2px', lineHeight: '1' }}>{price}</span>
                  <span style={{ fontSize: '16px', color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--body)' }}>/{period}</span>
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0 }}>
                  {fs.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--ink)', marginBottom: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={highlight ? 'var(--primary)' : 'var(--semantic-success)'} strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} style={{
                  display: 'block', textAlign: 'center',
                  fontSize: '18px', fontWeight: '400', textDecoration: 'none',
                  padding: '12px 24px', borderRadius: '60px',
                  background: highlight ? 'var(--primary)' : 'transparent',
                  color: highlight ? 'white' : 'var(--ink)',
                  border: highlight ? '1px solid var(--primary)' : '1px solid var(--ink)',
                  transition: 'background 0.15s',
                }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Band (Red) ─── */}
      <section style={{ background: 'var(--primary)', padding: '96px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(44px, 7vw, 96px)',
            fontWeight: '800',
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '-2px',
            lineHeight: '0.96',
            margin: '0 0 32px',
          }}>
            READY TO<br />RUN BETTER<br />REVIEWS?
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.75)', margin: '0 0 40px' }}>
            Free to start. No credit card required.
          </p>
          <Link href="/signup" style={{
            fontSize: '18px', fontWeight: '400', color: 'var(--primary)',
            textDecoration: 'none', padding: '14px 36px',
            background: 'white', borderRadius: '60px',
            border: '1px solid white', display: 'inline-block',
            transition: 'opacity 0.15s',
          }}>
            Create your workspace
          </Link>
        </div>
      </section>

      {/* ─── Footer (Dark) ─── */}
      <footer style={{ background: 'var(--ink)', padding: '48px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.57px' }}>OPEN360</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: '0.57px', textTransform: 'uppercase' }}>MIT License</span>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { label: 'GitHub', href: 'https://github.com/RAFSuNX/OPEN360' },
              { label: 'Sign in', href: '/login' },
              { label: 'Sign up', href: '/signup' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: '400', transition: 'color 0.15s' }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
