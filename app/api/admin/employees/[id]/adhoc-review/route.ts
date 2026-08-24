import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { mapAssignments } from '@/lib/assignments'
import { snapshotTemplateForCycle } from '@/lib/services/cycles'
import { sendEmail, buildReviewInviteEmail } from '@/lib/email'
import { Relationship } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const { id } = await params
  const { title, reviewerIds, endDate } = await req.json()

  const reviewee = await db.employee.findFirst({ where: { id, orgId }, select: { name: true } })
  if (!reviewee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Get all employees for org-tree mapping
  const allEmployees = await db.employee.findMany({
    where: { orgId, isActive: true },
    select: { id: true, managerId: true },
  })

  // Build reviewer list - either provided or auto from org tree
  let reviewerAssignments: { reviewerId: string; relationship: Relationship }[]

  if (reviewerIds && reviewerIds.length > 0) {
    // [P1] Validate all reviewer IDs exist and are active before creating anything
    const validIds = new Set(allEmployees.map(e => e.id))
    const invalid = (reviewerIds as string[]).filter(rid => !validIds.has(rid))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid reviewer IDs: ${invalid.join(', ')}` }, { status: 400 })
    }
    const orgMap = mapAssignments(id, allEmployees)
    reviewerAssignments = (reviewerIds as string[]).map((rid: string) => {
      const found = orgMap.find(a => a.reviewerId === rid)
      return { reviewerId: rid, relationship: found?.relationship ?? Relationship.PEER }
    })
  } else {
    // Auto from org tree, exclude self
    reviewerAssignments = mapAssignments(id, allEmployees).filter(a => a.reviewerId !== id)
  }

  if (reviewerAssignments.length === 0) {
    return NextResponse.json({ error: 'No reviewers found. Assign a manager or peers first.' }, { status: 400 })
  }

  // [P2] Validate end date before creating the cycle
  const now = new Date()
  const parsedEnd = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  if (isNaN(parsedEnd.getTime())) return NextResponse.json({ error: 'Invalid end date' }, { status: 400 })
  if (parsedEnd <= now) return NextResponse.json({ error: 'End date must be in the future' }, { status: 400 })

  // Find the org's first template to snapshot questions from
  const template = await db.questionTemplate.findFirst({
    where: { orgId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (!template) return NextResponse.json({ error: 'No question template found. Create a template before sending ad-hoc reviews.' }, { status: 400 })

  const cycleTitle = title || `Ad-hoc: ${reviewee.name} - ${now.toLocaleDateString()}`
  const cycle = await db.reviewCycle.create({
    data: { orgId, title: cycleTitle, startDate: now, endDate: parsedEnd, status: 'ACTIVE', templateId: template.id },
  })

  await snapshotTemplateForCycle(orgId, cycle.id)

  // Create assignments
  await db.reviewAssignment.createMany({
    data: [
      // Self review
      { cycleId: cycle.id, revieweeId: id, reviewerId: id, relationship: Relationship.SELF },
      // Other reviewers
      ...reviewerAssignments.map(a => ({
        cycleId: cycle.id, revieweeId: id,
        reviewerId: a.reviewerId, relationship: a.relationship,
      })),
    ],
    skipDuplicates: true,
  })

  // Send emails to ALL reviewers including the reviewee for their self-assessment
  const assignments = await db.reviewAssignment.findMany({
    where: { cycleId: cycle.id },
    include: {
      reviewer: { select: { name: true, email: true } },
      reviewee: { select: { name: true } },
    },
  })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  let sent = 0
  for (const a of assignments) {
    const { subject, html } = buildReviewInviteEmail({
      reviewerName: a.reviewer.name,
      revieweeName: a.reviewee.name,
      cycleTitle: cycle.title,
      appUrl,
      assignmentId: a.id,
    })
    await sendEmail({ to: a.reviewer.email, subject, html })
    sent++
  }

  return NextResponse.json({ cycleId: cycle.id, sent })
}
