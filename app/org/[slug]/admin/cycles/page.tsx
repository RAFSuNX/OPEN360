import { requireOrgAdmin } from '@/lib/org-context'
import { listCycles } from '@/lib/services/cycles'
import { listTemplates } from '@/lib/services/templates'
import { CycleList } from '@/app/admin/cycles/CycleList'

export default async function OrgCyclesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const [cycles, templates] = await Promise.all([listCycles(org.id), listTemplates(org.id)])
  return <CycleList initialCycles={cycles} templates={templates} />
}
