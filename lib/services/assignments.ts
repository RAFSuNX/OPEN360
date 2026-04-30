import { db } from '@/lib/db'
import { mapAssignments } from '@/lib/assignments'
import { sendEmail, buildReviewInviteEmail, buildResultsReadyEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'

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
  const org = { orgName: orgSettings.org_name, orgLogoUrl: orgSettings.org_logo_email || orgSettings.org_logo_url, orgTagline: orgSettings.org_tagline }
  for (const a of assignments) {
    const { subject, html } = buildReviewInviteEmail({
      reviewerName: a.reviewer.name,
      revieweeName: a.reviewee.name,
      cycleTitle: a.cycle.title,
      appUrl,
      assignmentId: a.id,
      org,
    })
    await sendEmail({ to: a.reviewer.email, subject, html })
  }
  return assignments.length
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
  const org = { orgName: orgSettings.org_name, orgLogoUrl: orgSettings.org_logo_email || orgSettings.org_logo_url, orgTagline: orgSettings.org_tagline }
  for (const r of reviewees) {
    const { subject, html } = buildResultsReadyEmail({
      employeeName: r.reviewee.name,
      cycleTitle,
      appUrl,
      org,
    })
    await sendEmail({ to: r.reviewee.email, subject, html })
  }
  return reviewees.length
}
