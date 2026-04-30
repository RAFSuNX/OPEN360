import { requireAdmin } from '@/lib/auth'
import { listEmployees } from '@/lib/services/employees'
import { db } from '@/lib/db'
import { EmployeeTable } from './EmployeeTable'

export default async function EmployeesPage() {
  await requireAdmin()
  const [employees, activeCycles] = await Promise.all([
    listEmployees(),
    db.reviewCycle.findMany({ where: { status: 'ACTIVE' }, select: { id: true, title: true } }),
  ])
  return <EmployeeTable initialEmployees={employees} activeCycles={activeCycles} />
}
