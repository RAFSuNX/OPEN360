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

export default function SignupPage() {
  const [orgName, setOrgName]     = useState('')
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  const slug = generateSlug(orgName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !email.trim()) { setError('All fields are required'); return }
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), adminEmail: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setDone(true)
      // Trigger Google OAuth — on success, session will pick up the new org
      setTimeout(() => signIn('google', { callbackUrl: `/org/${data.slug}/onboarding` }), 1200)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
    border: '1px solid var(--hairline-strong)', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--semantic-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontSize: '20px', fontWeight: '400', color: 'var(--ink)', margin: '0 0 8px' }}>Organization created</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>Redirecting to Google sign-in...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '0 24px' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '24px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.4px', margin: '0 0 6px' }}>
            Create your workspace
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            360-degree reviews for your team
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>
              Organization name
            </label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Acme Corp"
              style={inputStyle}
              autoFocus
            />
            {slug && (
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                open360.com/org/{slug}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>
              Your work email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 0' }}>
              Must match your Google account. You will be the admin.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--semantic-error)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '8px' }}
          >
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '24px' }}>
          Already have a workspace?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
