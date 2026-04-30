import { requireAdmin } from '@/lib/auth'
import { getCycle } from '@/lib/services/cycles'
import { listAssignments } from '@/lib/services/assignments'
import { notFound } from 'next/navigation'
import { CycleDetail } from './CycleDetail'

export default async function CyclePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [cycle, assignments] = await Promise.all([getCycle(id), listAssignments(id)])
  if (!cycle) notFound()
  return (
    <div>
      <CycleDetail cycle={cycle} initialAssignments={assignments} />
    </div>
  )
}
