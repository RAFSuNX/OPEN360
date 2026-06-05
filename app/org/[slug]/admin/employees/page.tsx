import { requireOrgAdmin } from '@/lib/org-context'
import { listEmployees } from '@/lib/services/employees'
import { EmployeeTable } from '@/app/admin/employees/EmployeeTable'

export default async function OrgEmployeesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, session } = await requireOrgAdmin(slug)
  const employees = await listEmployees(org.id)
  return <EmployeeTable initialEmployees={employees} currentUserId={session.user.id} />
}
