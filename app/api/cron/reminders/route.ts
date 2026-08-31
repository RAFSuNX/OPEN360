import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, buildReminderEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'

// Called by an external cron job — protect with CRON_SECRET
// GET /api/cron/reminders?secret=YOUR_CRON_SECRET
// Sends reminder emails to reviewers with pending submissions
// where the cycle deadline is within 3 days.

const DEADLINE_WARNING_DAYS = 3

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const deadlineCutoff = new Date(now.getTime() + DEADLINE_WARNING_DAYS * 24 * 60 * 60 * 1000)

  const cycles = await db.reviewCycle.findMany({
    where: { status: 'ACTIVE', endDate: { lte: deadlineCutoff, gte: now } },
    select: { id: true, title: true, endDate: true, orgId: true, org: { select: { slug: true } } },
  })

  if (cycles.length === 0) return NextResponse.json({ sent: 0, message: 'No cycles near deadline' })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let sent = 0

  for (const cycle of cycles) {
    const daysLeft = Math.ceil((cycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const orgSettings = await getOrgSettings(cycle.orgId)

    const assignments = await db.reviewAssignment.findMany({
      where: { cycleId: cycle.id, submitted: false },
      include: {
        reviewer: { select: { name: true, email: true } },
        reviewee: { select: { name: true } },
      },
    })

    // Group by reviewer — one email per reviewer
    const byReviewer = new Map<string, typeof assignments>()
    for (const a of assignments) {
      const key = a.reviewer.email
      if (!byReviewer.has(key)) byReviewer.set(key, [])
      byReviewer.get(key)!.push(a)
    }

    const dashboardUrl = `${appUrl}/org/${cycle.org.slug}/dashboard`
    const logoUrl = orgSettings.org_logo_email ? `${appUrl}/api/logo?org=${cycle.org.slug}` : ''
    const org = { orgName: orgSettings.org_name, orgLogoUrl: logoUrl, orgTagline: orgSettings.org_tagline }

    for (const [email, reviewerAssignments] of byReviewer) {
      const reviewer = reviewerAssignments[0].reviewer
      // Use the first pending assignment ID for the direct review link
      const firstAssignmentId = reviewerAssignments[0].id
      try {
        const { subject, html } = buildReminderEmail({
          reviewerName: reviewer.name,
          cycleTitle: cycle.title,
          endDate: cycle.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          appUrl: dashboardUrl,
          assignmentId: firstAssignmentId,
          org,
        })
        await sendEmail({ to: email, subject, html })
        sent++
      } catch (err) {
        console.error(`Reminder failed for ${email}:`, err)
      }
    }
  }

  return NextResponse.json({ sent, cycles: cycles.length })
}
