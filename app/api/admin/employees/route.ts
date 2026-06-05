import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listEmployees, createEmployee, updateEmployee, EmployeeExistsError } from '@/lib/services/employees'
import { checkEmployeeLimit, PlanLimitError } from '@/lib/plan'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId
  const employees = await listEmployees(orgId)
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { name, email, employeeId, department, role, managerId } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'name and email are required' }, { status: 400 })

  try {
    await checkEmployeeLimit(orgId)
    const employee = await createEmployee(orgId, { name, email, employeeId, department, role, managerId })
    return NextResponse.json(employee, { status: 201 })
  } catch (e) {
    if (e instanceof EmployeeExistsError) return NextResponse.json({ error: e.message }, { status: 409 })
    if (e instanceof PlanLimitError) return NextResponse.json({ error: e.message }, { status: 403 })
    throw e
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { id, name, employeeId, department, role, managerId, isAdmin } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Prevent last-admin lockout
  if (isAdmin === false) {
    const adminCount = await db.employee.count({ where: { orgId, isAdmin: true, isActive: true } })
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
    }
  }

  const employee = await updateEmployee(orgId, id, { name, employeeId, department, role, managerId, isAdmin })
  return NextResponse.json(employee)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await db.employee.update({ where: { id, orgId }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
