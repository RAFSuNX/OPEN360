import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { buildResults } from '@/lib/services/results'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cycleId: string; employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cycleId, employeeId } = await params
  const results = await buildResults(cycleId, employeeId, true)
  return NextResponse.json(results)
}
