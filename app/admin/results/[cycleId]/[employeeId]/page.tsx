import { requireAdmin } from '@/lib/auth'
import { getCycle } from '@/lib/services/cycles'
import { buildResults } from '@/lib/services/results'
import { db } from '@/lib/db'
import MyResults from '@/components/dashboard/MyResults'
import { notFound } from 'next/navigation'

export default async function AdminResultsPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>
}) {
  await requireAdmin()
  const { cycleId, employeeId } = await params

  const [cycle, employee] = await Promise.all([
    getCycle(cycleId),
    db.employee.findUnique({ where: { id: employeeId }, select: { id: true, name: true, email: true } }),
  ])

  if (!cycle || !employee) {
    notFound()
  }

  const results = await buildResults(cycleId, employeeId)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{employee.name}</h1>
      <p className="text-gray-500 text-sm mb-1">{employee.email}</p>
      <p className="text-gray-400 text-sm mb-6">{cycle.title}</p>
      <MyResults results={results} />
    </div>
  )
}
