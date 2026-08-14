'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

const PLANS = [
  {
    id: 'FREE',
    label: 'Free',
    price: '$0 / month',
    features: ['Up to 10 employees', 'Unlimited review cycles', 'Email notifications', 'All question types'],
  },
  {
    id: 'PRO',
    label: 'Pro',
    price: '$29 / month',
    features: ['Unlimited employees', 'Priority support', 'Advanced analytics', 'Custom branding'],
    highlight: true,
  },
]

export default function SignupPage() {
  const [orgName, setOrgName] = useState('')
  const [email, setEmail]     = useState('')
  const [plan, setPlan]       = useState<'FREE' | 'PRO'>('FREE')
  const [tos, setTos]         = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [resultSlug, setResultSlug] = useState('')

  const slug = generateSlug(orgName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !email.trim()) { setError('All fields are required'); return }
    if (!tos) { setError('You must accept the Terms of Service to continue'); return }
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), adminEmail: email.trim().toLowerCase(), plan }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setResultSlug(data.slug)
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#1c1208', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            OPEN<span style={{ color: 'var(--primary)' }}>360</span>
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--semantic-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              Workspace created!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: '0 0 24px' }}>
              Now sign in using <strong>{email}</strong> to access your workspace.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => signIn('google', { callbackUrl: `/org/${resultSlug}/onboarding` })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--ink)', borderRadius: '28px', padding: '13px 18px', fontSize: '15px', fontWeight: '400', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                Continue with Google
              </button>
              <a href="/login" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>
                Or use email code instead →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#1c1208', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            OPEN<span style={{ color: 'var(--primary)' }}>360</span>
          </span>
        </a>
        <Link href="/login" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          Already have a workspace? <span style={{ color: 'var(--primary)' }}>Sign in</span>
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>

          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Get started</p>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.8px', lineHeight: '1.1', margin: '0 0 8px' }}>
              Create your workspace
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--body)', margin: 0 }}>
              Set up your organization in under a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Plan selection */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--body)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Choose a plan</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as 'FREE' | 'PRO')}
                    style={{
                      padding: '16px',
                      border: plan === p.id ? '2px solid var(--primary)' : '1px solid var(--hairline)',
                      borderRadius: '8px',
                      background: plan === p.id ? 'rgba(245,78,0,0.04)' : 'var(--canvas-soft)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)' }}>{p.label}</span>
                      {p.highlight && (
                        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: '9999px', fontFamily: "'JetBrains Mono', monospace" }}>
                          PRO
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: plan === p.id ? 'var(--primary)' : 'var(--muted)', margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace" }}>{p.price}</p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: '11px', color: 'var(--body)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-success)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* Org name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '6px' }}>
                Organization name
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
              />
              {slug && (
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '5px', fontFamily: "'JetBrains Mono', monospace" }}>
                  URL: /org/<span style={{ color: 'var(--ink)' }}>{slug}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '6px' }}>
                Your work email
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '5px' }}>
                Must match your Google account. You will be the organization admin.
              </p>
            </div>

            {/* ToS */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tos}
                  onChange={e => setTos(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: 'var(--primary)', flexShrink: 0, width: 'auto' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--body)', lineHeight: '1.5' }}>
                  I agree to the{' '}
                  <Link href="/terms" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</Link>
                </span>
              </label>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--error-bg)', borderRadius: '8px', border: '1px solid var(--error-border)' }}>
                <p style={{ fontSize: '13px', color: 'var(--semantic-error)', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tos}
              className="btn-primary"
              style={{ width: '100%', opacity: loading || !tos ? 0.55 : 1, cursor: loading || !tos ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating workspace...' : `Create workspace — ${plan === 'PRO' ? '$29/mo' : 'Free'}`}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
