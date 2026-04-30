import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listCycles, createCycle, updateCycleStatus, deleteCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cycles = await listCycles()
  return NextResponse.json(cycles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, startDate, endDate } = await req.json()
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: 'title, startDate, and endDate are required' }, { status: 400 })
  }

  try {
    const cycle = await createCycle({ title, startDate, endDate })
    return NextResponse.json(cycle, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  if (!['ACTIVE', 'CLOSED'].includes(status)) {
    return NextResponse.json({ error: 'status must be ACTIVE or CLOSED' }, { status: 400 })
  }

  const cycle = await updateCycleStatus(id, status as CycleStatus)
  return NextResponse.json(cycle)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    await deleteCycle(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
