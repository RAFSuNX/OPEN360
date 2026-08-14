import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminSession } from '@/lib/auth'
import { listEmployees, createEmployee, updateEmployee, EmployeeExistsError } from '@/lib/services/employees'
import { checkEmployeeLimit, PlanLimitError } from '@/lib/plan'
import { db } from '@/lib/db'
import { writeAudit } from '@/lib/audit'

const CreateEmployeeSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  employeeId: z.string().max(100).optional(),
  department: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  managerId: z.string().uuid().optional(),
})

const UpdateEmployeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  employeeId: z.string().max(100).optional(),
  department: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  managerId: z.string().uuid().optional(),
  isAdmin: z.boolean().optional(),
})

const DeleteEmployeeSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const employees = await listEmployees(orgId)
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId, email: actorEmail } = auth

  const parsed = CreateEmployeeSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { name, email, employeeId, department, role, managerId } = parsed.data

  try {
    await checkEmployeeLimit(orgId)
    const employee = await createEmployee(orgId, { name, email, employeeId, department, role, managerId })
    void writeAudit({ orgId, actorEmail, action: 'employee.create', target: email })
    return NextResponse.json(employee, { status: 201 })
  } catch (e) {
    if (e instanceof EmployeeExistsError) return NextResponse.json({ error: e.message }, { status: 409 })
    if (e instanceof PlanLimitError) return NextResponse.json({ error: e.message }, { status: 403 })
    throw e
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const parsed = UpdateEmployeeSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { id, name, employeeId, department, role, managerId, isAdmin } = parsed.data

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
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId, email } = auth

  const parsed = DeleteEmployeeSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await db.employee.update({ where: { id: parsed.data.id, orgId }, data: { isActive: false } })
  void writeAudit({ orgId, actorEmail: email, action: 'employee.delete', target: parsed.data.id })
  return NextResponse.json({ ok: true })
}
