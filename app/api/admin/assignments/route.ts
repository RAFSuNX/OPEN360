import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listAssignments, autoAssign, deleteAssignment, sendCycleEmails, sendResultsEmails } from '@/lib/services/assignments'
import { updateCycleStatus, snapshotTemplateForCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cycleId = req.nextUrl.searchParams.get('cycleId')
  if (!cycleId) return NextResponse.json({ error: 'cycleId is required' }, { status: 400 })

  const assignments = await listAssignments(cycleId)
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cycleId, action } = await req.json()
  if (!cycleId || !action) return NextResponse.json({ error: 'cycleId and action are required' }, { status: 400 })

  if (action === 'auto-assign') {
    const count = await autoAssign(cycleId)
    return NextResponse.json({ assigned: count })
  }

  if (action === 'activate') {
    // Guard against double-activate
    const { getCycle } = await import('@/lib/services/cycles')
    const cycle = await getCycle(cycleId)
    if (cycle?.status === CycleStatus.ACTIVE) return NextResponse.json({ error: 'Cycle already active' }, { status: 409 })
    await snapshotTemplateForCycle(cycleId)
    const emailsSent = await sendCycleEmails(cycleId)
    await updateCycleStatus(cycleId, CycleStatus.ACTIVE)
    return NextResponse.json({ emailsSent })
  }

  if (action === 'close') {
    const { getCycle } = await import('@/lib/services/cycles')
    const cycle = await getCycle(cycleId)
    if (cycle?.status === CycleStatus.CLOSED) return NextResponse.json({ error: 'Cycle already closed' }, { status: 409 })
    // Send results emails first - if they fail, status stays ACTIVE (retriable)
    const emailsSent = await sendResultsEmails(cycleId)
    await updateCycleStatus(cycleId, CycleStatus.CLOSED)
    return NextResponse.json({ emailsSent })
  }

  if (action === 're-open') {
    await updateCycleStatus(cycleId, CycleStatus.ACTIVE)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 })

  await deleteAssignment(id)
  return NextResponse.json({ ok: true })
}
