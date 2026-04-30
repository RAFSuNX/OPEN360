import { requireAdmin } from '@/lib/auth'
import { listCycles } from '@/lib/services/cycles'
import { CycleList } from './CycleList'

export default async function CyclesPage() {
  await requireAdmin()
  const cycles = await listCycles()
  return <CycleList initialCycles={cycles} />
}
