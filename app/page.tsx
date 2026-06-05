import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrgSettings, isOnboardingComplete } from '@/lib/org'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  // Find which org this user belongs to
  const employee = await db.employee.findFirst({
    where: { email: session.user.email, isActive: true },
    include: { org: { select: { slug: true } } },
  })

  if (!employee) redirect('/signup')

  const slug = employee.org.slug

  if (employee.isAdmin) {
    const org = await getOrgSettings(employee.orgId)
    if (!isOnboardingComplete(org)) redirect(`/org/${slug}/onboarding`)
    redirect(`/org/${slug}/admin`)
  }

  redirect(`/org/${slug}/dashboard`)
}
