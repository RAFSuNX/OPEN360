'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: scrolled ? 'rgba(28,18,8,0.88)' : '#1c1208',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'background 0.25s, backdrop-filter 0.25s, border-color 0.25s',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: '800', color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          OPEN<span style={{ color: 'var(--primary)' }}>360</span>
        </span>
      </Link>

      {/* Center links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { label: 'Features', href: '#features' },
          { label: 'How it works', href: '#how-it-works' },
          { label: 'Pricing', href: '#pricing' },
        ].map(({ label, href }) => (
          <a key={label} href={href} style={{
            fontSize: '14px', fontWeight: '400',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'color 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'white')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Link href="/login" style={{
          fontSize: '14px', fontWeight: '400',
          color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none', padding: '7px 14px',
          transition: 'color 0.15s',
        }}>
          Sign in
        </Link>
        <Link href="/signup" style={{
          fontSize: '14px', fontWeight: '500', color: 'white',
          textDecoration: 'none', padding: '8px 20px',
          background: 'var(--primary)', borderRadius: '28px',
          transition: 'background 0.15s',
          display: 'inline-block',
        }}>
          Get started free
        </Link>
      </div>
    </nav>
  )
}
