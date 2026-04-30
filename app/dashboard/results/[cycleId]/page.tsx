import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import MyResults from '@/components/dashboard/MyResults'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ cycleId: string }>
}) {
  const session = await requireAuth()
  const { cycleId } = await params

  const cycle = await getCycle(cycleId)
  if (!cycle || cycle.status !== 'CLOSED') {
    redirect('/dashboard')
  }

  const results = await buildResults(cycleId, session.user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Your Results</h1>
      <p className="text-gray-500 mb-6">{cycle.title}</p>
      <MyResults results={results} />
    </div>
  )
}
