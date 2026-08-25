import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/org-context'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import MyResults from '@/components/dashboard/MyResults'
import Link from 'next/link'

export default async function OrgResultsPage({
  params,
}: {
  params: Promise<{ slug: string; cycleId: string }>
}) {
  const { slug, cycleId } = await params
  const { org, employee } = await getOrgContext(slug)

  const cycle = await getCycle(org.id, cycleId)
  if (!cycle || cycle.status !== 'CLOSED') redirect(`/org/${slug}/dashboard`)

  const results = await buildResults(org.id, cycleId, employee.id)

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link href={`/org/${slug}/dashboard`} style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>
      <MyResults results={results} cycleTitle={cycle.title} employeeName={employee.name} />
    </div>
  )
}
