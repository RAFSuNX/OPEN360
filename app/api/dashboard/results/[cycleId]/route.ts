import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildResults } from '@/lib/services/results'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { cycleId } = await params

  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  if (cycle.status !== 'CLOSED') {
    return NextResponse.json({ error: 'Results not available until cycle is closed' }, { status: 403 })
  }

  const results = await buildResults(orgId, cycleId, session.user.id)
  return NextResponse.json(results)
}
