import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // [P1] IDOR fix: employees can only view their own profile; admins can view any
  if (!session.user.isAdmin && session.user.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const employee = await db.employee.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, employeeId: true,
      department: true, role: true,
      manager: { select: { id: true, name: true, role: true } },
      directReports: { select: { id: true, name: true, role: true } },
    },
  })

  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(employee)
}
