import { db } from '@/lib/db'
import { mapAssignments } from '@/lib/assignments'
import { sendEmail, buildReviewInviteEmail, buildResultsReadyEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'

const EMAIL_CONCURRENCY = 10

async function sendConcurrent(tasks: (() => Promise<void>)[]): Promise<number> {
  let sent = 0
  for (let i = 0; i < tasks.length; i += EMAIL_CONCURRENCY) {
    const results = await Promise.allSettled(tasks.slice(i, i + EMAIL_CONCURRENCY).map(t => t()))
    sent += results.filter(r => r.status === 'fulfilled').length
  }
  return sent
}

export async function listAssignments(cycleId: string) {
  return db.reviewAssignment.findMany({
    where: { cycleId },
    include: {
      reviewee: { select: { name: true, email: true } },
      reviewer: { select: { name: true, email: true } },
    },
    orderBy: [{ revieweeId: 'asc' }, { relationship: 'asc' }],
  })
}

export async function autoAssign(cycleId: string) {
  const employees = await db.employee.findMany({
    where: { isActive: true },
    select: { id: true, managerId: true },
  })

  const data = employees.flatMap(emp =>
    mapAssignments(emp.id, employees).map(a => ({
      cycleId,
      revieweeId: emp.id,
      reviewerId: a.reviewerId,
      relationship: a.relationship,
    }))
  )

  const result = await db.reviewAssignment.createMany({ data, skipDuplicates: true })
  return result.count
}

export async function deleteAssignment(id: string) {
  return db.reviewAssignment.delete({ where: { id } })
}

export async function sendCycleEmails(cycleId: string) {
  const assignments = await db.reviewAssignment.findMany({
    where: { cycleId, submitted: false },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
      cycle: { select: { title: true } },
    },
  })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings()
  const logoEmailUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/logo`
  const org = { orgName: orgSettings.org_name, orgLogoUrl: logoEmailUrl, orgTagline: orgSettings.org_tagline }

  const tasks = assignments.map(a => () => {
    const { subject, html } = buildReviewInviteEmail({
      reviewerName: a.reviewer.name,
      revieweeName: a.reviewee.name,
      cycleTitle: a.cycle.title,
      appUrl,
      assignmentId: a.id,
      org,
    })
    return sendEmail({ to: a.reviewer.email, subject, html })
  })

  return sendConcurrent(tasks)
}

export async function sendResultsEmails(cycleId: string) {
  const cycle = await db.reviewCycle.findUnique({ where: { id: cycleId }, select: { title: true } })
  const cycleTitle = cycle?.title ?? cycleId

  const reviewees = await db.reviewAssignment.findMany({
    where: { cycleId },
    select: { reviewee: { select: { name: true, email: true } } },
    distinct: ['revieweeId'],
  })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings()
  const logoEmailUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/logo`
  const org = { orgName: orgSettings.org_name, orgLogoUrl: logoEmailUrl, orgTagline: orgSettings.org_tagline }

  const tasks = reviewees.map(r => () => {
    const { subject, html } = buildResultsReadyEmail({
      employeeName: r.reviewee.name,
      cycleTitle,
      appUrl,
      org,
    })
    return sendEmail({ to: r.reviewee.email, subject, html })
  })

  return sendConcurrent(tasks)
}
