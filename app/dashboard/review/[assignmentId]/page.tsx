import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation'; import { db } from '@/lib/db'
export default async function P({ params }: { params: Promise<{ assignmentId: string }> }) {
  const [s, { assignmentId }] = await Promise.all([getServerSession(authOptions), params])
  if (!s?.user?.email) redirect(`/login?next=/dashboard/review/${assignmentId}`)
  // Derive slug from the assignment itself — works for all users including multi-org
  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    select: { cycle: { select: { org: { select: { slug: true } } } } },
  })
  const slug = assignment?.cycle?.org?.slug ?? s?.user?.orgSlug ?? ''
  if (!slug) redirect('/login')
  redirect(`/org/${slug}/dashboard/review/${assignmentId}`)
}
