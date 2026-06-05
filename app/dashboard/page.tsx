import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Legacy redirect: /dashboard → /org/[slug]/dashboard
export default async function LegacyDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgSlug) redirect('/login')
  redirect(`/org/${session.user.orgSlug}/dashboard`)
}
