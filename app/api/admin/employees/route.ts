import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listEmployees, createEmployee, updateEmployee, EmployeeExistsError } from '@/lib/services/employees'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employees = await listEmployees()
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, employeeId, department, role, managerId } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'name and email are required' }, { status: 400 })

  try {
    const employee = await createEmployee({ name, email, employeeId, department, role, managerId })
    return NextResponse.json(employee, { status: 201 })
  } catch (e) {
    if (e instanceof EmployeeExistsError) return NextResponse.json({ error: e.message }, { status: 409 })
    throw e
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, employeeId, department, role, managerId, isAdmin } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // [P1] Prevent last-admin lockout - only block if actually demoting an existing admin
  if (isAdmin === false) {
    const current = await db.employee.findUnique({ where: { id }, select: { isAdmin: true } })
    if (current?.isAdmin === true) {
      const adminCount = await db.employee.count({ where: { isAdmin: true, isActive: true } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin. Promote another employee first.' }, { status: 400 })
      }
    }
  }

  const employee = await updateEmployee(id, {
    name: name ?? undefined,
    employeeId: employeeId ?? null,
    department: department ?? null,
    role: role ?? null,
    managerId: managerId ?? null,
    ...(typeof isAdmin === 'boolean' ? { isAdmin } : {}),
  })
  return NextResponse.json(employee)
}
