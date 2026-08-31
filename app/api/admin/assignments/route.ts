import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { listAssignments, autoAssign, deleteAssignment, sendCycleEmails, sendResultsEmails } from '@/lib/services/assignments'
import { updateCycleStatus, snapshotTemplateForCycle, getCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'
import { writeAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const cycleId = req.nextUrl.searchParams.get('cycleId')
  if (!cycleId) return NextResponse.json({ error: 'cycleId is required' }, { status: 400 })

  const assignments = await listAssignments(orgId, cycleId)
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId, email } = auth

  const body = await req.json()
  const { cycleId, action, employeeId, revieweeId, reviewerId, relationship } = body
  if (!cycleId || !action) return NextResponse.json({ error: 'cycleId and action are required' }, { status: 400 })

  if (action === 'auto-assign') {
    const count = await autoAssign(orgId, cycleId)
    void writeAudit({ orgId, actorEmail: email, action: 'assignment.auto_assign', target: cycleId })
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
    void writeAudit({ orgId, actorEmail: email, action: 'cycle.activate', target: cycleId })
    return NextResponse.json({ activated: true, emailsSent: sent })
  }

  if (action === 'add') {
    if (!revieweeId || !reviewerId || !relationship) {
      return NextResponse.json({ error: 'revieweeId, reviewerId, relationship required' }, { status: 400 })
    }
    if (!['SELF','MANAGER','PEER','DIRECT_REPORT'].includes(relationship)) {
      return NextResponse.json({ error: 'invalid relationship' }, { status: 400 })
    }
    const { db } = await import('@/lib/db')
    const assignment = await db.reviewAssignment.create({
      data: { cycleId, revieweeId, reviewerId, relationship },
      include: { reviewer: { select: { name: true, email: true } }, reviewee: { select: { name: true, email: true } } },
    })
    return NextResponse.json(assignment, { status: 201 })
  }

  if (action === 'send-employee') {
    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    // Snapshot questions if not done yet, activate cycle so reviewers can submit
    const cycle = await getCycle(orgId, cycleId)
    if (cycle?.status === CycleStatus.DRAFT) {
      await snapshotTemplateForCycle(orgId, cycleId)
      await updateCycleStatus(orgId, cycleId, CycleStatus.ACTIVE)
    }
    const sent = await sendCycleEmails(orgId, cycleId, employeeId)
    void writeAudit({ orgId, actorEmail: email, action: 'cycle.send_employee', target: employeeId })
    return NextResponse.json({ sent })
  }

  if (action === 'close') {
    await updateCycleStatus(orgId, cycleId, CycleStatus.CLOSED)
    const sent = await sendResultsEmails(orgId, cycleId)
    void writeAudit({ orgId, actorEmail: email, action: 'cycle.close', target: cycleId })
    return NextResponse.json({ closed: true, emailsSent: sent })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

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
