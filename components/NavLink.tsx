'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  exact?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function NavLink({ href, exact, children, style }: Props) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`nav-link${active ? ' nav-link-active' : ''}`}
      style={{ padding: '5px 10px', borderRadius: '6px', ...style }}
    >
      {children}
    </Link>
  )
}
