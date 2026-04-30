import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, buildReviewInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { cycleId } = await req.json()
  if (!cycleId) return NextResponse.json({ error: 'cycleId required' }, { status: 400 })

  const assignments = await db.reviewAssignment.findMany({
    where: { cycleId, revieweeId: id, submitted: false },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
      cycle: { select: { title: true } },
    },
  })

  if (assignments.length === 0) {
    return NextResponse.json({ error: 'No pending assignments found for this employee in this cycle' }, { status: 404 })
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let sent = 0
  for (const a of assignments) {
    const { subject, html } = buildReviewInviteEmail({
      reviewerName: a.reviewer.name,
      revieweeName: a.reviewee.name,
      cycleTitle: a.cycle.title,
      appUrl,
      assignmentId: a.id,
    })
    await sendEmail({ to: a.reviewer.email, subject, html })
    sent++
  }

  return NextResponse.json({ sent })
}
