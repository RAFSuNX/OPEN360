import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function P({ params }: { params: Promise<{ assignmentId: string }> }) {
  const [s, { assignmentId }] = await Promise.all([getServerSession(authOptions), params])
  redirect(`/org/${s?.user?.orgSlug ?? ''}/dashboard/review/${assignmentId}`)
}
