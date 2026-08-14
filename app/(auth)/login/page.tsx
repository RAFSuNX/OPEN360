'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

type Step = 'initial' | 'otp-sent' | 'loading'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [step, setStep] = useState<Step>('initial')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  let errorMessage: string | null = null
  if (error === 'AccessDenied') {
    errorMessage = 'That Google account isn\'t linked to any workspace. Sign up first, or use your work email below.'
  } else if (error) {
    errorMessage = 'Login failed. Please try again.'
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setOtpError(''); setStep('loading')
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    if (res.ok) {
      setStep('otp-sent')
    } else {
      setOtpError('Failed to send code. Try again.')
      setStep('initial')
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setOtpError(''); setStep('loading')
    const result = await signIn('otp', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      redirect: false,
    })
    if (result?.ok) {
      window.location.href = result.url ?? '/'
    } else {
      setOtpError('Invalid or expired code. Please try again.')
      setStep('otp-sent')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1c1208', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            OPEN<span style={{ color: 'var(--primary)' }}>360</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>No account?</span>
          <a href="/signup" style={{ fontSize: '14px', fontWeight: '500', color: 'white', textDecoration: 'none', padding: '8px 20px', background: 'var(--primary)', borderRadius: '28px' }}>
            Get started free
          </a>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '44px 40px', width: '100%', maxWidth: '400px' }}>

          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Sign in</p>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.5px', lineHeight: '1.1', margin: '0 0 6px' }}>Welcome back</h1>
            <p style={{ fontSize: '14px', color: 'var(--body)', margin: 0 }}>Sign in to your OPEN360 workspace.</p>
          </div>

          {errorMessage && (
            <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--semantic-error)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Google */}
          <button
            onClick={() => { setGoogleLoading(true); signIn('google', { callbackUrl: '/' }) }}
            disabled={googleLoading || step === 'loading'}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--ink)', borderRadius: '28px', padding: '13px 18px', fontSize: '15px', fontWeight: '400', cursor: 'pointer', fontFamily: 'inherit', opacity: googleLoading ? 0.65 : 1, marginBottom: '20px' }}
          >
            {googleLoading ? <span className="spinner-muted" /> : (
              <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--hairline)' }} />
          </div>

          {/* OTP flow */}
          {step === 'initial' || step === 'loading' ? (
            <form onSubmit={handleSendCode}>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={step === 'loading'}
                style={{ marginBottom: '10px' }}
              />
              {otpError && <p style={{ fontSize: '12px', color: 'var(--semantic-error)', margin: '0 0 8px' }}>{otpError}</p>}
              <button
                type="submit"
                disabled={step === 'loading' || !email.trim()}
                className="btn-primary"
                style={{ width: '100%', opacity: step === 'loading' || !email.trim() ? 0.55 : 1, cursor: step === 'loading' || !email.trim() ? 'not-allowed' : 'pointer' }}
              >
                {step === 'loading' ? 'Sending...' : 'Send login code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <p style={{ fontSize: '13px', color: 'var(--body)', margin: '0 0 14px' }}>
                Enter the 6-digit code sent to <strong>{email}</strong>.{' '}
                <button type="button" onClick={() => { setStep('initial'); setCode('') }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', padding: 0, fontFamily: 'inherit' }}>Change email</button>
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ marginBottom: '10px', letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}
              />
              {otpError && <p style={{ fontSize: '12px', color: 'var(--semantic-error)', margin: '0 0 8px' }}>{otpError}</p>}
              <button
                type="submit"
                disabled={code.length !== 6}
                className="btn-primary"
                style={{ width: '100%', opacity: code.length !== 6 ? 0.55 : 1, cursor: code.length !== 6 ? 'not-allowed' : 'pointer' }}
              >
                Sign in
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
