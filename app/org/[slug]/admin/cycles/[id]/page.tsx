import { requireOrgAdmin } from '@/lib/org-context'
import { getCycle } from '@/lib/services/cycles'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CycleDetail } from '@/app/admin/cycles/[id]/CycleDetail'

export default async function OrgCycleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const { org } = await requireOrgAdmin(slug)

  const cycle = await getCycle(org.id, id)
  if (!cycle) notFound()

  const [assignments, employees] = await Promise.all([
    db.reviewAssignment.findMany({
      where: { cycleId: id },
      include: {
        reviewee: { select: { name: true, email: true } },
        reviewer: { select: { name: true, email: true } },
      },
      orderBy: [{ revieweeId: 'asc' }, { relationship: 'asc' }],
    }),
    // All employees including externals — for the reviewer picker
    db.employee.findMany({
      where: { orgId: org.id, isActive: true },
      select: { id: true, name: true, email: true, isExternal: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <CycleDetail cycle={cycle} initialAssignments={assignments} employees={employees} orgSlug={slug} />
}
