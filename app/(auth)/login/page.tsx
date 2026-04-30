'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let errorMessage: string | null = null
  if (error === 'AccessDenied') {
    errorMessage = 'Your email is not authorized to access this system.'
  } else if (error) {
    errorMessage = 'Login failed. Please try again.'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'var(--primary)',
              borderRadius: '6px',
            }} />
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}>OPEN360</span>
          </div>
          <p style={{
            fontSize: '22px',
            fontWeight: '400',
            color: 'var(--ink)',
            letterSpacing: '-0.3px',
            lineHeight: '1.3',
            margin: 0,
          }}>Sign in to your workspace</p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '6px' }}>
            360-degree employee reviews
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: '#fde8ec',
            border: '1px solid #f5c0cb',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--semantic-error)',
          }}>
            {errorMessage}
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'var(--surface-card)',
            color: 'var(--ink)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '8px',
            padding: '11px 18px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--canvas)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--surface-card)')}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{
          marginTop: '20px',
          fontSize: '12px',
          color: 'var(--muted-soft)',
          textAlign: 'center',
        }}>
          Access restricted to authorized accounts only
        </p>
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
