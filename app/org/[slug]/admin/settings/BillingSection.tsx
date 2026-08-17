'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const PRO_FEATURES = [
  'Unlimited employees',
  'Priority support',
  'Advanced analytics',
  'Custom branding',
]

function BillingContent({ plan, slug }: { plan: string; slug: string }) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const justUpgraded = searchParams.get('upgraded') === '1'

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p className="section-label" style={{ marginBottom: '8px' }}>Plan & Billing</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>
              {plan === 'EXTENDED' ? 'Extended' : 'Free'} Plan
            </h2>
            <span style={{
              fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: '9999px',
              background: plan === 'EXTENDED' ? 'var(--primary)' : 'var(--surface-strong)',
              color: plan === 'EXTENDED' ? 'white' : 'var(--muted)',
            }}>
              {plan}
            </span>
          </div>

          {plan === 'FREE' ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Free plan — up to 10 employees. Upgrade to Extended Plan for unlimited.
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              You're on the Extended plan. All features unlocked.
            </p>
          )}
        </div>

        {plan === 'FREE' && (
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Loading...' : 'Upgrade to Extended Plan — $29/mo'}
            </button>
          </div>
        )}
      </div>

      {plan === 'FREE' && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--hairline)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Extended Plan includes
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {PRO_FEATURES.map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--body)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-success)" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {justUpgraded && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--semantic-success-bg, #edfaf3)', borderRadius: '8px', fontSize: '13px', color: 'var(--semantic-success)', fontWeight: '500' }}>
          🎉 You're now on Extended Plan! All limits have been removed.
        </div>
      )}
    </div>
  )
}

export function BillingSection({ plan, slug }: { plan: string; slug: string }) {
  return (
    <Suspense>
      <BillingContent plan={plan} slug={slug} />
    </Suspense>
  )
}
