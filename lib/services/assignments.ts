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

export async function listAssignments(orgId: string, cycleId: string) {
  // Verify cycle belongs to org
  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
  if (!cycle) throw new Error('Cycle not found')

  return db.reviewAssignment.findMany({
    where: { cycleId },
    include: {
      reviewee: { select: { name: true, email: true } },
      reviewer: { select: { name: true, email: true } },
    },
    orderBy: [{ revieweeId: 'asc' }, { relationship: 'asc' }],
  })
}

export async function autoAssign(orgId: string, cycleId: string) {
  // Verify cycle belongs to org
  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
  if (!cycle) throw new Error('Cycle not found')

  const employees = await db.employee.findMany({
    where: { orgId, isActive: true, isExternal: false },
    select: { id: true, managerId: true, department: true },
  })

  const data = employees.flatMap(emp =>
    mapAssignments(emp.id, employees).map(a => ({
      cycleId,
      revieweeId: emp.id,
      reviewerId: a.reviewerId,
      relationship: a.relationship,
    }))
  )

  // Add external reviewers for each employee
  const externalLinks = await db.externalReviewerLink.findMany({
    where: { orgId },
    select: { revieweeId: true, reviewerEmail: true, reviewerName: true, relationship: true },
  })

  for (const link of externalLinks) {
    // Upsert external employee record so ReviewAssignment FK works
    const ext = await db.employee.upsert({
      where: { orgId_email: { orgId, email: link.reviewerEmail } },
      update: { name: link.reviewerName, isExternal: true },
      create: { orgId, name: link.reviewerName, email: link.reviewerEmail, isExternal: true },
    })
    // Ensure they're on the allowlist so they can log in
    await db.allowlist.upsert({
      where: { orgId_email: { orgId, email: link.reviewerEmail } },
      update: {},
      create: { orgId, email: link.reviewerEmail },
    })
    data.push({ cycleId, revieweeId: link.revieweeId, reviewerId: ext.id, relationship: link.relationship })
  }

  const result = await db.reviewAssignment.createMany({ data, skipDuplicates: true })
  return result.count
}

export async function deleteAssignment(orgId: string, id: string) {
  // Verify assignment belongs to org via cycle
  const assignment = await db.reviewAssignment.findFirst({
    where: { id },
    include: { cycle: { select: { orgId: true } } },
  })
  if (!assignment || assignment.cycle.orgId !== orgId) throw new Error('Assignment not found')
  return db.reviewAssignment.delete({ where: { id } })
}

export async function sendCycleEmails(orgId: string, cycleId: string, revieweeId?: string) {
  const assignments = await db.reviewAssignment.findMany({
    where: { cycleId, submitted: false, ...(revieweeId ? { revieweeId } : {}) },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, orgId: true } },
    },
  })

  // Security: only send for cycles belonging to this org
  const filtered = assignments.filter(a => a.cycle.orgId === orgId)

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings(orgId)
  const logoEmailUrl = `${appUrl}/api/logo`
  const org = { orgName: orgSettings.org_name, orgLogoUrl: logoEmailUrl, orgTagline: orgSettings.org_tagline }

  const tasks = filtered.map(a => () => {
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

export async function sendResultsEmails(orgId: string, cycleId: string) {
  const cycle = await db.reviewCycle.findFirst({
    where: { id: cycleId, orgId },
    select: { title: true },
  })
  if (!cycle) throw new Error('Cycle not found')

  const reviewees = await db.reviewAssignment.findMany({
    where: { cycleId },
    select: { reviewee: { select: { name: true, email: true } } },
    distinct: ['revieweeId'],
  })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const orgSettings = await getOrgSettings(orgId)
  const logoEmailUrl = `${appUrl}/api/logo`
  const org = { orgName: orgSettings.org_name, orgLogoUrl: logoEmailUrl, orgTagline: orgSettings.org_tagline }

  const tasks = reviewees.map(r => () => {
    const { subject, html } = buildResultsReadyEmail({
      employeeName: r.reviewee.name,
      cycleTitle: cycle.title,
      appUrl,
      org,
    })
    return sendEmail({ to: r.reviewee.email, subject, html })
  })

  return sendConcurrent(tasks)
}
