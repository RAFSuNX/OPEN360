'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export default function NewOrgPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [plan, setPlan] = useState<'FREE' | 'PRO'>('FREE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'unauthenticated') {
    router.replace('/login')
    return null
  }

  const slug = generateSlug(orgName)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), plan }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      // Force session refresh so JWT picks up new org membership
      router.push(`/org/${data.slug}/onboarding`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1c1208', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          OPEN<span style={{ color: 'var(--primary)' }}>360</span>
        </span>
        <Link href="/orgs" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
          ← Back to workspaces
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '56px 24px' }}>
        <div style={{ maxWidth: '460px', width: '100%' }}>
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>New workspace</p>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: '1.1', margin: '0 0 6px' }}>
              Create a workspace
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0 }}>
              You'll be the admin of this new organization.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Plan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['FREE', 'PRO'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  style={{
                    padding: '14px 16px',
                    border: plan === p ? '2px solid var(--primary)' : '1px solid var(--hairline)',
                    borderRadius: '8px',
                    background: plan === p ? 'rgba(245,78,0,0.04)' : 'var(--canvas-soft)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '2px' }}>{p === 'FREE' ? 'Free' : 'Pro'}</div>
                  <div style={{ fontSize: '11px', color: plan === p ? 'var(--primary)' : 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {p === 'FREE' ? '$0 / month' : '$29 / month'}
                  </div>
                </button>
              ))}
            </div>

            {/* Org name */}
            <div>
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

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--error-bg)', borderRadius: '8px', border: '1px solid var(--error-border)' }}>
                <p style={{ fontSize: '13px', color: 'var(--semantic-error)', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="btn-primary"
              style={{ opacity: loading || !orgName.trim() ? 0.55 : 1, cursor: loading || !orgName.trim() ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating...' : 'Create workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
