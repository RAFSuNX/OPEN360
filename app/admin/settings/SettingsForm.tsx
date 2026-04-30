'use client'
import { useState } from 'react'

interface Props { initialSettings: Record<string, string> }

const inputStyle = {
  background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function SettingsForm({ initialSettings }: Props) {
  const [threshold, setThreshold] = useState(initialSettings['anonymity_threshold'] ?? '1')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonymity_threshold: threshold }),
    })
    setMsg(res.ok ? 'Settings saved.' : 'Failed to save.')
    setSaving(false)
  }

  return (
    <div className="card" style={{ maxWidth: '480px', padding: '24px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>Anonymity</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: 'var(--ink)', marginBottom: '6px', fontWeight: '500' }}>
          Minimum responses to show results
        </label>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px', lineHeight: '1.5' }}>
          How many reviewers must submit before results are shown to the reviewee.
          Set to 1 to always show results. Applies to Peers and Direct Reports only.
        </p>
        <input type="number" min="1" max="10" value={threshold}
          onChange={e => setThreshold(e.target.value)}
          style={{ ...inputStyle, width: '80px' }} />
      </div>

      {msg && <p style={{ fontSize: '13px', color: 'var(--semantic-success)', marginBottom: '12px' }}>{msg}</p>}
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}
