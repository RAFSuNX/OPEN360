import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { mapAssignments } from '@/lib/assignments'
import { sendEmail, buildReviewInviteEmail } from '@/lib/email'
import { Relationship } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title, reviewerIds, endDate } = await req.json()

  const reviewee = await db.employee.findUnique({ where: { id }, select: { name: true } })
  if (!reviewee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  // Get all employees for org-tree mapping
  const allEmployees = await db.employee.findMany({
    where: { isActive: true },
    select: { id: true, managerId: true },
  })

  // Build reviewer list - either provided or auto from org tree
  let reviewerAssignments: { reviewerId: string; relationship: Relationship }[]

  if (reviewerIds && reviewerIds.length > 0) {
    // Manual selection - determine relationship from org tree
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

  // Create a dedicated cycle for this employee
  const cycleTitle = title || `Ad-hoc: ${reviewee.name} — ${new Date().toLocaleDateString()}`
  const cycle = await db.reviewCycle.create({
    data: {
      title: cycleTitle,
      startDate: new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    },
  })

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

  // Send emails to all non-self reviewers
  const assignments = await db.reviewAssignment.findMany({
    where: { cycleId: cycle.id, NOT: { relationship: Relationship.SELF } },
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
    })
    await sendEmail({ to: a.reviewer.email, subject, html })
    sent++
  }

  return NextResponse.json({ cycleId: cycle.id, sent })
}
