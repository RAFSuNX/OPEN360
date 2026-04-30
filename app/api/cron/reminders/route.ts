import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, buildReminderEmail } from '@/lib/email'
import { sendResultsEmails } from '@/lib/services/assignments'
import { CycleStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  // Auto-close ACTIVE cycles whose endDate has passed
  const expiredCycles = await db.reviewCycle.findMany({
    where: { status: CycleStatus.ACTIVE, endDate: { lt: now } },
  })

  let closedCount = 0
  for (const cycle of expiredCycles) {
    await db.reviewCycle.update({ where: { id: cycle.id }, data: { status: CycleStatus.CLOSED } })
    await sendResultsEmails(cycle.id)
    closedCount++
  }

  if (closedCount > 0) {
    console.log(`[cron/reminders] Auto-closed ${closedCount} expired cycle(s)`)
  }

  const cycles = await db.reviewCycle.findMany({
    where: { status: CycleStatus.ACTIVE, endDate: { gte: now, lte: threeDaysFromNow } },
  })

  let sent = 0
  for (const cycle of cycles) {
    const pending = await db.reviewAssignment.findMany({
      where: { cycleId: cycle.id, submitted: false },
      include: { reviewer: { select: { name: true, email: true } } },
    })
    for (const assignment of pending) {
      const { subject, html } = buildReminderEmail({
        reviewerName: assignment.reviewer.name,
        cycleTitle: cycle.title,
        endDate: cycle.endDate.toISOString().slice(0, 10),
        appUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
        assignmentId: assignment.id,
      })
      await sendEmail({ to: assignment.reviewer.email, subject, html })
      sent++
    }
  }

  return NextResponse.json({ sent, closed: closedCount })
}
