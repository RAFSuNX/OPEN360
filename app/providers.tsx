'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toast'
import RouteProgress from '@/components/RouteProgress'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <RouteProgress />
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
