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
    body: 'Every org gets its own isolated workspace with custom branding and settings.',
  },
  {
    title: 'Question templates',
    body: 'Build reusable templates with rating scales and open-text questions.',
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
  { n: '04', title: 'View results', body: 'Employees and admins see anonymized, aggregated feedback and ratings.' },
]

function HomePage() {
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100vh', color: 'var(--ink)' }}>

      {/* ─── Nav ─── */}
      <nav style={{
        background: '#1c1208',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '26px', height: '26px',
            background: 'var(--primary)', borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>OPEN360</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/login" style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '7px 14px' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            fontSize: '14px', fontWeight: '500', color: 'white',
            textDecoration: 'none', padding: '8px 20px',
            background: 'var(--primary)', borderRadius: '28px',
            transition: 'background 0.15s',
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        background: '#1c1208',
        padding: '88px 32px 104px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        {/* Orange glow */}
        <div style={{
          position: 'absolute', bottom: '-80px', left: '40%',
          width: '500px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(245,78,0,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'rgba(245,78,0,0.1)', border: '1px solid rgba(245,78,0,0.25)',
            borderRadius: '9999px', padding: '5px 14px', marginBottom: '36px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              Open Source · Free to Start
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 112px)',
            fontWeight: '800',
            color: 'white',
            lineHeight: '0.96',
            letterSpacing: '-2px',
            margin: '0 0 36px',
            maxWidth: '880px',
          }}>
            Performance<br />
            reviews, <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>done</span><br />
            right.
          </h1>

          <p style={{ fontSize: '18px', fontWeight: '400', color: 'rgba(255,255,255,0.6)', lineHeight: '1.65', maxWidth: '500px', margin: '0 0 48px' }}>
            Self-hostable, multi-tenant 360° review platform.
            Set up your organization, run structured cycles,
            and deliver anonymous feedback at scale.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              fontSize: '16px', fontWeight: '500', color: 'white',
              textDecoration: 'none', padding: '12px 28px',
              background: 'var(--primary)', borderRadius: '28px',
              display: 'inline-block', transition: 'background 0.15s',
            }}>
              Create your workspace
            </Link>
            <Link href="https://github.com/RAFSuNX/OPEN360" target="_blank" rel="noopener" style={{
              fontSize: '16px', fontWeight: '400', color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none', padding: '11px 24px',
              borderRadius: '28px', border: '1px solid rgba(255,255,255,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'border-color 0.15s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section style={{ background: 'var(--canvas-soft)', borderBottom: '1px solid var(--hairline)', padding: '28px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '56px', flexWrap: 'wrap' }}>
          {[
            { value: '360°', label: 'Feedback coverage' },
            { value: 'AES-256', label: 'Encrypted at rest' },
            { value: 'MIT', label: 'Open source' },
            { value: 'Multi-tenant', label: 'Full org isolation' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 3px', letterSpacing: '-0.5px' }}>{value}</p>
              <p style={{ fontSize: '11px', color: 'var(--body)', margin: 0, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.57px' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ background: 'var(--canvas)', padding: '88px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Features</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-1.5px', lineHeight: '1.08', margin: '0 0 56px', maxWidth: '560px' }}>
            Everything you need for great reviews
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {features.map(({ title, body }) => (
              <div key={title} style={{
                padding: '28px 24px',
                background: 'var(--canvas-soft)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--primary)',
              }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-0.2px' }}>{title}</p>
                <p style={{ fontSize: '14px', fontWeight: '400', color: 'var(--body)', margin: 0, lineHeight: '1.65' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section style={{ background: '#1c1208', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '88px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '700', color: 'white', letterSpacing: '-1.5px', lineHeight: '1.08', margin: '0 0 64px' }}>
            Up and running in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px' }}>
            {steps.map(({ n, title, body }) => (
              <div key={n}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700', color: 'var(--primary)', margin: '0 0 16px', letterSpacing: '0.06em' }}>{n}</p>
                <div style={{ width: '24px', height: '2px', background: 'rgba(245,78,0,0.4)', marginBottom: '16px', borderRadius: '1px' }} />
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 10px', letterSpacing: '-0.2px' }}>{title}</p>
                <p style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.65' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section style={{ background: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '88px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-1.5px', lineHeight: '1.08', margin: '0 0 56px' }}>
            Simple, honest pricing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '680px' }}>
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
                background: highlight ? '#1c1208' : 'var(--canvas-soft)',
                borderRadius: '8px',
                padding: '32px',
                border: highlight ? '1px solid rgba(245,78,0,0.3)' : '1px solid var(--hairline)',
                position: 'relative',
              }}>
                {highlight && (
                  <span style={{
                    position: 'absolute', top: '-12px', left: '28px',
                    fontSize: '11px', fontWeight: '700', color: 'white',
                    background: 'var(--primary)', borderRadius: '9999px',
                    padding: '3px 12px', textTransform: 'uppercase', letterSpacing: '0.08em',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Most Popular
                  </span>
                )}
                <p style={{ fontSize: '12px', fontWeight: '700', color: highlight ? 'rgba(255,255,255,0.4)' : 'var(--body)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{plan}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                  <span style={{ fontSize: '52px', fontWeight: '800', color: highlight ? 'white' : 'var(--ink)', letterSpacing: '-2px', lineHeight: '1' }}>{price}</span>
                  <span style={{ fontSize: '14px', color: highlight ? 'rgba(255,255,255,0.4)' : 'var(--body)' }}>/{period}</span>
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0 }}>
                  {fs.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: highlight ? 'rgba(255,255,255,0.75)' : 'var(--ink)', marginBottom: '12px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} style={{
                  display: 'block', textAlign: 'center',
                  fontSize: '15px', fontWeight: '500', textDecoration: 'none',
                  padding: '11px 24px', borderRadius: '28px',
                  background: highlight ? 'var(--primary)' : 'transparent',
                  color: highlight ? 'white' : 'var(--ink)',
                  border: highlight ? '1px solid var(--primary)' : '1px solid var(--hairline-strong)',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background: '#1c1208', padding: '100px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(245,78,0,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px' }}>Get started today</p>
          <h2 style={{
            fontSize: 'clamp(40px, 6vw, 88px)',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: '0.96',
            margin: '0 0 28px',
          }}>
            Ready to run<br />
            <span style={{ color: 'var(--primary)' }}>better reviews?</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', margin: '0 0 40px' }}>
            Free to start. No credit card required.
          </p>
          <Link href="/signup" style={{
            fontSize: '16px', fontWeight: '500', color: 'white',
            textDecoration: 'none', padding: '13px 36px',
            background: 'var(--primary)', borderRadius: '28px',
            display: 'inline-block', transition: 'background 0.15s',
          }}>
            Create your workspace
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ background: '#130d05', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '22px', height: '22px', background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>OPEN360</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>MIT</span>
          </div>
          <div style={{ display: 'flex', gap: '28px' }}>
            {[
              { label: 'GitHub', href: 'https://github.com/RAFSuNX/OPEN360' },
              { label: 'Sign in', href: '/login' },
              { label: 'Sign up', href: '/signup' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.15s' }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
