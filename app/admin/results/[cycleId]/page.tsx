import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function P({ params }: { params: Promise<{ cycleId: string }> }) {
  const [s, { cycleId }] = await Promise.all([getServerSession(authOptions), params])
  redirect(`/org/${s?.user?.orgSlug ?? ''}/admin/results/${cycleId}`)
}
