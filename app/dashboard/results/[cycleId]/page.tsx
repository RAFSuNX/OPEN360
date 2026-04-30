import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import MyResults from '@/components/dashboard/MyResults'
import Link from 'next/link'

export default async function ResultsPage({ params }: { params: Promise<{ cycleId: string }> }) {
  const session = await requireAuth()
  const { cycleId } = await params

  const cycle = await getCycle(cycleId)
  if (!cycle || cycle.status !== 'CLOSED') redirect('/dashboard')

  const results = await buildResults(cycleId, session.user.id)

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Link href="/dashboard" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
          - Back to dashboard
        </Link>
      </div>
      <MyResults results={results} cycleTitle={cycle.title} />
    </div>
  )
}
