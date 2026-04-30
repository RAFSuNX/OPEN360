'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImageCropModal } from '@/components/ImageCropModal'
import { compressLogoForEmail } from '@/lib/compressForEmail'

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '11px 14px', fontSize: '15px', fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s',
}

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const [orgTagline, setOrgTagline] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = ev => { setCropSrc(ev.target?.result as string); setError('') }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleCropDone(dataUrl: string) {
    setLogoPreview(dataUrl); setLogoUrl(dataUrl); setCropSrc(null)
  }

  async function finish() {
    if (!orgName.trim()) { setError('Organization name is required'); return }
    setSaving(true); setError('')
    try {
      const emailLogoUrl = logoUrl && logoUrl.startsWith('data:')
        ? await compressLogoForEmail(logoUrl)
        : logoUrl
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName.trim(),
          org_tagline: orgTagline.trim(),
          org_logo_url: logoUrl,
          org_logo_email: emailLogoUrl,
          onboarding_complete: 'true',
        }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError('Failed to save. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const totalSteps = 3

  return (
    <>
    {cropSrc && <ImageCropModal imageSrc={cropSrc} onDone={handleCropDone} onCancel={() => setCropSrc(null)} />}
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '6px' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)' }}>OPEN360</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: '3px', flex: 1, borderRadius: '9999px',
              background: s <= step ? 'var(--primary)' : 'var(--hairline-strong)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1: Welcome + Org Name */}
        {step === 1 && (
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>Step 1 of {totalSteps}</p>
            <h1 style={{ fontSize: '28px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              Welcome to OPEN360
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '0 0 32px', lineHeight: '1.5' }}>
              Let's set up your workspace. This takes 2 minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>
                  Organization name <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>
                  Tagline <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '400' }}>optional</span>
                </label>
                <input
                  placeholder="e.g. Building the future of work"
                  value={orgTagline}
                  onChange={e => setOrgTagline(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            {error && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginTop: '12px' }}>{error}</p>}
            <button
              onClick={() => { if (!orgName.trim()) { setError('Organization name is required'); return } setError(''); setStep(2) }}
              className="btn-primary" style={{ marginTop: '24px', width: '100%', padding: '12px', fontSize: '15px' }}>
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Logo */}
        {step === 2 && (
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>Step 2 of {totalSteps}</p>
            <h1 style={{ fontSize: '28px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              Add your logo
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '0 0 32px', lineHeight: '1.5' }}>
              Your logo appears in email notifications sent to your team.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Logo preview */}
              <div style={{
                width: '100%', height: '140px', background: 'var(--canvas-soft)',
                border: `2px dashed ${logoPreview ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }} onClick={() => fileRef.current?.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" style={{ maxHeight: '100px', maxWidth: '280px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Click to upload logo</p>
                    <p style={{ fontSize: '11px', color: 'var(--muted-soft)', margin: '2px 0 0' }}>PNG, JPG up to 500KB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>or paste a URL</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
              </div>

              <input
                placeholder="https://yourcompany.com/logo.png"
                value={logoPreview ? '' : logoUrl}
                onChange={e => { setLogoUrl(e.target.value); setLogoPreview('') }}
                style={inputStyle}
              />
            </div>

            {error && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginTop: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Back</button>
              <button onClick={() => { setError(''); setStep(3) }} className="btn-primary" style={{ flex: 2, padding: '12px', fontSize: '15px' }}>
                {logoUrl || logoPreview ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <p className="section-label" style={{ marginBottom: '8px' }}>Step 3 of {totalSteps}</p>
            <h1 style={{ fontSize: '28px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              Looking good
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '0 0 32px', lineHeight: '1.5' }}>
              Here's how your organization will appear across OPEN360.
            </p>

            {/* Preview card */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--hairline-soft)' }}>
                {(logoPreview || logoUrl) ? (
                  <img src={logoPreview || logoUrl} alt="logo" style={{ height: '40px', maxWidth: '120px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>{orgName}</p>
                  {orgTagline && <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '2px 0 0' }}>{orgTagline}</p>}
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                This branding will appear in all review emails sent to your team.
              </p>
            </div>

            {error && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Back</button>
              <button onClick={finish} disabled={saving} className="btn-primary" style={{ flex: 2, padding: '12px', fontSize: '15px' }}>
                {saving ? 'Setting up...' : 'Launch OPEN360'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
