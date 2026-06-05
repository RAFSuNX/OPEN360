import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function P({ params }: { params: Promise<{ cycleId: string; employeeId: string }> }) {
  const [s, { cycleId, employeeId }] = await Promise.all([getServerSession(authOptions), params])
  redirect(`/org/${s?.user?.orgSlug ?? ''}/admin/results/${cycleId}/${employeeId}`)
}
