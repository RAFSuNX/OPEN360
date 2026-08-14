import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, buildReviewInviteEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const { assignmentId } = await req.json()
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

  const assignment = await db.reviewAssignment.findFirst({
    where: { id: assignmentId, cycle: { orgId } },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, status: true } },
    },
  })

  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  if (assignment.submitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
  if (assignment.cycle.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Cycle is not active' }, { status: 400 })
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings(orgId)
  const logoUrl = `${appUrl}/api/logo`
  const org = { orgName: orgSettings.org_name, orgLogoUrl: logoUrl, orgTagline: orgSettings.org_tagline }

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
