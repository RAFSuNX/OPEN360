import { requireAdmin } from '@/lib/auth'
import { listCycles } from '@/lib/services/cycles'
import { CycleList } from './CycleList'

export default async function CyclesPage() {
  await requireAdmin()
  const cycles = await listCycles()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review Cycles</h1>
      <CycleList initialCycles={cycles} />
    </div>
  )
}
