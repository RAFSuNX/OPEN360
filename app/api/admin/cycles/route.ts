import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { listCycles, createCycle, updateCycleStatus, deleteCycle } from '@/lib/services/cycles'
import { CycleStatus } from '@prisma/client'
import { writeAudit } from '@/lib/audit'

const CreateCycleSchema = z.object({
  title: z.string().min(1).max(300),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()),
  templateId: z.string().uuid().optional(),
})

const UpdateCycleSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']),
})

const DeleteCycleSchema = z.object({
  id: z.string().uuid(),
})

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

  const parsed = CreateCycleSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { title, startDate, endDate, templateId } = parsed.data

  try {
    const cycle = await createCycle(orgId, { title, startDate, endDate, templateId })
    void writeAudit({ orgId, actorEmail: session.user.email!, action: 'cycle.create', target: title })
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

  const parsed = UpdateCycleSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const { id, status } = parsed.data
  const cycle = await updateCycleStatus(orgId, id, status as CycleStatus)
  return NextResponse.json(cycle)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const parsed = DeleteCycleSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    await deleteCycle(orgId, parsed.data.id)
    void writeAudit({ orgId, actorEmail: session.user.email!, action: 'cycle.delete', target: parsed.data.id })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
