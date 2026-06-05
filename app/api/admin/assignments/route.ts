import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listAssignments, autoAssign, deleteAssignment, sendCycleEmails, sendResultsEmails } from '@/lib/services/assignments'
import { updateCycleStatus, snapshotTemplateForCycle, getCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const cycleId = req.nextUrl.searchParams.get('cycleId')
  if (!cycleId) return NextResponse.json({ error: 'cycleId is required' }, { status: 400 })

  const assignments = await listAssignments(orgId, cycleId)
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { cycleId, action } = await req.json()
  if (!cycleId || !action) return NextResponse.json({ error: 'cycleId and action are required' }, { status: 400 })

  if (action === 'auto-assign') {
    const count = await autoAssign(orgId, cycleId)
    return NextResponse.json({ assigned: count })
  }

  if (action === 'activate') {
    const cycle = await getCycle(orgId, cycleId)
    if (cycle?.status === CycleStatus.ACTIVE) {
      return NextResponse.json({ error: 'Cycle already active' }, { status: 400 })
    }
    await snapshotTemplateForCycle(orgId, cycleId)
    await updateCycleStatus(orgId, cycleId, CycleStatus.ACTIVE)
    const sent = await sendCycleEmails(orgId, cycleId)
    return NextResponse.json({ activated: true, emailsSent: sent })
  }

  if (action === 'close') {
    await updateCycleStatus(orgId, cycleId, CycleStatus.CLOSED)
    const sent = await sendResultsEmails(orgId, cycleId)
    return NextResponse.json({ closed: true, emailsSent: sent })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    await deleteAssignment(orgId, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
