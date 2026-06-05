import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildResults } from '@/lib/services/results'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cycleId: string; employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const orgId = session.user.orgId

  const { cycleId, employeeId } = await params
  const results = await buildResults(orgId, cycleId, employeeId, true)
  return NextResponse.json(results)
}
