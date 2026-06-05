import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listCycles, createCycle, updateCycleStatus, deleteCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId
  const cycles = await listCycles(orgId)
  return NextResponse.json(cycles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { title, startDate, endDate, templateId } = await req.json()
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: 'title, startDate, and endDate are required' }, { status: 400 })
  }

  try {
    const cycle = await createCycle(orgId, { title, startDate, endDate, templateId })
    return NextResponse.json(cycle, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  if (!['DRAFT', 'ACTIVE', 'CLOSED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const cycle = await updateCycleStatus(orgId, id, status as CycleStatus)
  return NextResponse.json(cycle)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    await deleteCycle(orgId, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
