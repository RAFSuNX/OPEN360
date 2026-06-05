import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function LegacyAdminLayout(props: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgSlug) redirect('/login')
  return props.children
}
