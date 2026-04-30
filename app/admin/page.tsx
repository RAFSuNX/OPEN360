import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function AdminHomePage() {
  await requireAdmin()

  const [employeeCount, cycleCount] = await Promise.all([
    db.employee.count({ where: { isActive: true } }),
    db.reviewCycle.count(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-white rounded-lg p-5 border">
          <div className="text-3xl font-bold">{employeeCount}</div>
          <div className="text-gray-500 text-sm mt-1">Active employees</div>
        </div>
        <div className="bg-white rounded-lg p-5 border">
          <div className="text-3xl font-bold">{cycleCount}</div>
          <div className="text-gray-500 text-sm mt-1">Review cycles</div>
        </div>
      </div>
    </div>
  )
}
