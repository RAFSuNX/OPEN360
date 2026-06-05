import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

// Legacy redirect: /admin → /org/[slug]/admin
export default async function LegacyAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgSlug) redirect('/login')
  redirect(`/org/${session.user.orgSlug}/admin`)
}
