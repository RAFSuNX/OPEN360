import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAssignmentWithQuestions, submitReview } from '@/lib/services/reviews'

// Always do a fresh DB lookup by email to avoid stale JWT employeeId
async function getReviewerId(email: string, assignmentId: string): Promise<string | null> {
  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    select: { cycle: { select: { orgId: true } } },
  })
  if (!assignment) return null
  const emp = await db.employee.findFirst({
    where: { email, orgId: assignment.cycle.orgId, isActive: true },
    select: { id: true },
  })
  return emp?.id ?? null
}

const SubmitReviewSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string().min(1).max(10000),
  })).min(1),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { assignmentId } = await params
  const reviewerId = await getReviewerId(session.user.email, assignmentId)
  if (!reviewerId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = await getAssignmentWithQuestions(assignmentId, reviewerId)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { assignmentId } = await params

  const parsed = SubmitReviewSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const reviewerId = await getReviewerId(session.user.email, assignmentId)
  if (!reviewerId) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  try {
    await submitReview(assignmentId, reviewerId, parsed.data.answers)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Submission failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
