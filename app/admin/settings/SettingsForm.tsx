'use client'
import { useState, useRef } from 'react'

interface Props { initialSettings: Record<string, string> }

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function SettingsForm({ initialSettings }: Props) {
  const [orgName, setOrgName] = useState(initialSettings['org_name'] ?? '')
  const [orgTagline, setOrgTagline] = useState(initialSettings['org_tagline'] ?? '')
  const [logoUrl, setLogoUrl] = useState(initialSettings['org_logo_url'] ?? '')
  const [logoPreview, setLogoPreview] = useState(initialSettings['org_logo_url'] ?? '')
  const [threshold, setThreshold] = useState(initialSettings['anonymity_threshold'] ?? '1')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { setMsg('Logo must be under 500KB'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setLogoPreview(result); setLogoUrl(result)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_name: orgName,
        org_tagline: orgTagline,
        org_logo_url: logoUrl,
        anonymity_threshold: threshold,
        onboarding_complete: 'true',
      }),
    })
    setMsg(res.ok ? 'Settings saved.' : 'Failed to save.')
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>

      {/* Organization */}
      <div className="card" style={{ padding: '24px' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>Organization</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>Name</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Your organization name" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>Tagline</label>
            <input value={orgTagline} onChange={e => setOrgTagline(e.target.value)} placeholder="Optional tagline" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>Logo</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {logoPreview && (
                <img src={logoPreview} alt="logo" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain', border: '1px solid var(--hairline)', borderRadius: '6px', padding: '4px' }} />
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}>
                Upload image
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} />
            </div>
            <input value={logoPreview ? '' : logoUrl} onChange={e => { setLogoUrl(e.target.value); setLogoPreview('') }}
              placeholder="Or paste logo URL" style={{ ...inputStyle, marginTop: '8px' }} />
          </div>
        </div>
      </div>

      {/* Review settings */}
      <div className="card" style={{ padding: '24px' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>Anonymity</p>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>
          Minimum responses to show results
        </label>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
          Minimum reviewers required before results are shown to the reviewee. Applies to Peers and Direct Reports only.
        </p>
        <input type="number" min="1" max="10" value={threshold}
          onChange={e => setThreshold(e.target.value)}
          style={{ ...inputStyle, width: '80px' }} />
      </div>

      {msg && <p style={{ fontSize: '13px', color: msg.includes('saved') ? 'var(--semantic-success)' : 'var(--semantic-error)' }}>{msg}</p>}

      <button onClick={save} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}
