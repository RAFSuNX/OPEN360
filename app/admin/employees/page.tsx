import { requireAdmin } from '@/lib/auth'
import { listEmployees } from '@/lib/services/employees'
import { EmployeeTable } from './EmployeeTable'

export default async function EmployeesPage() {
  const session = await requireAdmin()
  const employees = await listEmployees()
  return <EmployeeTable initialEmployees={employees} currentUserId={session.user.id} />
}
