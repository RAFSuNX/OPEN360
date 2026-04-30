import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listEmployees, createEmployee, EmployeeExistsError } from '@/lib/services/employees'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employees = await listEmployees()
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, department, role, managerId } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'name and email are required' }, { status: 400 })

  try {
    const employee = await createEmployee({ name, email, department, role, managerId })
    return NextResponse.json(employee, { status: 201 })
  } catch (e) {
    if (e instanceof EmployeeExistsError) return NextResponse.json({ error: e.message }, { status: 409 })
    throw e
  }
}
