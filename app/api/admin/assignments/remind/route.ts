import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, buildReviewInviteEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assignmentId } = await req.json()
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, status: true } },
    },
  })

  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  if (assignment.submitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings()
  const org = { orgName: orgSettings.org_name, orgLogoUrl: orgSettings.org_logo_url, orgTagline: orgSettings.org_tagline }

  const { subject, html } = buildReviewInviteEmail({
    reviewerName: assignment.reviewer.name,
    revieweeName: assignment.reviewee.name,
    cycleTitle: assignment.cycle.title,
    appUrl,
    assignmentId,
    org,
  })

  await sendEmail({ to: assignment.reviewer.email, subject, html })
  return NextResponse.json({ sent: true, to: assignment.reviewer.email })
}
