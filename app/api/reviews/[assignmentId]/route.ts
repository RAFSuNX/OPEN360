import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAssignmentWithQuestions, submitReview } from '@/lib/services/reviews'

export async function GET(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { assignmentId } = await params
  const data = await getAssignmentWithQuestions(assignmentId, session.user.id)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { assignmentId } = await params
  const { answers } = await req.json()
  if (!answers || !Array.isArray(answers)) return NextResponse.json({ error: 'answers array required' }, { status: 400 })
  try {
    await submitReview(assignmentId, session.user.id, answers)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Submission failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
