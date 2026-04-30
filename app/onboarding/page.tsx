import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOrgSettings, isOnboardingComplete } from '@/lib/org'
import { OnboardingFlow } from './OnboardingFlow'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  const org = await getOrgSettings()
  if (isOnboardingComplete(org)) redirect('/admin')

  return <OnboardingFlow />
}
