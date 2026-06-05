import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getOrgSettings, isOnboardingComplete } from '@/lib/org'
import { OnboardingFlow } from '@/app/onboarding/OnboardingFlow'

export default async function OrgOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect(`/login?next=/org/${slug}/onboarding`)

  const org = await db.organization.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  })
  if (!org) redirect('/')

  const employee = await db.employee.findFirst({
    where: { email: session.user.email, orgId: org.id, isAdmin: true },
  })
  if (!employee) redirect(`/org/${slug}/dashboard`)

  const settings = await getOrgSettings(org.id)
  if (isOnboardingComplete(settings)) redirect(`/org/${slug}/admin`)

  return <OnboardingFlow />
}
