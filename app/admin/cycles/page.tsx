import { requireAdmin } from '@/lib/auth'
import { listCycles } from '@/lib/services/cycles'
import { listTemplates } from '@/lib/services/templates'
import { CycleList } from './CycleList'

export default async function CyclesPage() {
  await requireAdmin()
  const [cycles, templates] = await Promise.all([listCycles(), listTemplates()])
  return <CycleList initialCycles={cycles} templates={templates} />
}
