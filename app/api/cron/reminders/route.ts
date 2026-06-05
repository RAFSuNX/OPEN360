import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
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
    select: { id: true, title: true, endDate: true, orgId: true },
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

    for (const [email, reviewerAssignments] of byReviewer) {
      const reviewer = reviewerAssignments[0].reviewer
      const names = reviewerAssignments.map(a => a.reviewee.name)
      try {
        await sendEmail({
          to: email,
          subject: `Reminder: ${names.length} review${names.length > 1 ? 's' : ''} due in ${daysLeft} day${daysLeft > 1 ? 's' : ''} — ${cycle.title}`,
          html: `
            <p>Hi ${reviewer.name},</p>
            <p>You have <strong>${names.length} pending review${names.length > 1 ? 's' : ''}</strong> due in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
            <ul>${names.map(n => `<li>${n}</li>`).join('')}</ul>
            <p><a href="${appUrl}/dashboard">Go to my reviews</a></p>
            <p style="color:#888;font-size:12px;">${orgSettings.org_name || 'OPEN360'} · ${cycle.title}</p>
          `,
        })
        sent++
      } catch (err) {
        console.error(`Reminder failed for ${email}:`, err)
      }
    }
  }

  return NextResponse.json({ sent, cycles: cycles.length })
}
