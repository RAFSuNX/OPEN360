'use client'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.35)',
        background: 'none', cursor: 'pointer', fontFamily: 'inherit',
        padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
        whiteSpace: 'nowrap',
      }}
    >
      Sign out
    </button>
  )
}
