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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cycleId } = await params

  const cycle = await db.reviewCycle.findUnique({ where: { id: cycleId } })
  if (!cycle) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
  }
  if (cycle.status !== 'CLOSED') {
    return NextResponse.json({ error: 'Results are not available until the cycle is closed' }, { status: 403 })
  }

  const results = await buildResults(cycleId, session.user.id)
  return NextResponse.json(results)
}
