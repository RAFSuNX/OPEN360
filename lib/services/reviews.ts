import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { notifyAdminIfCycleComplete } from '@/lib/services/notifications'

export async function getPendingReviews(employeeId: string) {
  return db.reviewAssignment.findMany({
    where: { reviewerId: employeeId, submitted: false, cycle: { status: 'ACTIVE' } },
    include: {
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, endDate: true } },
    },
  })
}

export async function getAssignmentWithQuestions(assignmentId: string, reviewerId: string) {
  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      reviewee: { select: { name: true, role: true } },
      cycle: { select: { title: true, status: true, orgId: true } },
    },
  })

  if (!assignment || assignment.reviewerId !== reviewerId) return null

  const isSelf = assignment.relationship === 'SELF'
  const revieweeRole = assignment.reviewee.role
  const roleFilter = revieweeRole
    ? [{ applicableRole: null as null }, { applicableRole: revieweeRole }]
    : [{ applicableRole: null as null }]

  const cycleQuestions = await db.cycleQuestion.findMany({
    where: { cycleId: assignment.cycleId, OR: roleFilter },
    orderBy: { sortOrder: 'asc' },
  })

  const swapText = <T extends { text: string; selfText?: string | null }>(q: T) => ({
    ...q,
    text: (isSelf && q.selfText) ? q.selfText : q.text,
  })

  if (cycleQuestions.length > 0) {
    return { assignment, questions: cycleQuestions.map(swapText) }
  }

  // Cycle not yet snapshotted — null signals "not ready" to the page
  const totalCycleQuestions = await db.cycleQuestion.count({ where: { cycleId: assignment.cycleId } })
  if (totalCycleQuestions === 0) return null

  // Cycle was snapshotted but this reviewee's role has no matching questions
  // Fall back to all generic questions (applicable_role IS NULL) so form is never empty
  const genericQuestions = await db.cycleQuestion.findMany({
    where: { cycleId: assignment.cycleId, applicableRole: null },
    orderBy: { sortOrder: 'asc' },
  })
  if (genericQuestions.length === 0) return null

  return { assignment, questions: genericQuestions.map(swapText) }
}

export async function submitReview(
  assignmentId: string,
  reviewerId: string,
  answers: { questionId: string; answer: string }[]
) {
  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: { cycle: { select: { status: true, orgId: true } } },
  })

  if (!assignment || assignment.reviewerId !== reviewerId) throw new Error('Assignment not found')
  if (assignment.submitted) throw new Error('Already submitted')
  if (assignment.cycle.status !== 'ACTIVE') throw new Error('Cycle is not active')

  const reviewee = await db.employee.findUnique({
    where: { id: assignment.revieweeId },
    select: { role: true },
  })
  const revieweeRole = reviewee?.role
  const roleFilter = revieweeRole
    ? [{ applicableRole: null as null }, { applicableRole: revieweeRole }]
    : [{ applicableRole: null as null }]

  let expectedQuestions = await db.cycleQuestion.findMany({
    where: { cycleId: assignment.cycleId, OR: roleFilter },
    select: { id: true },
  })
  // If no role-specific questions found, fall back to generic only (mirrors getAssignmentWithQuestions)
  if (expectedQuestions.length === 0) {
    expectedQuestions = await db.cycleQuestion.findMany({
      where: { cycleId: assignment.cycleId, applicableRole: null },
      select: { id: true },
    })
  }
  if (expectedQuestions.length === 0) throw new Error('No questions found for this review. Contact your admin.')

  const invalid = answers.find(a => !a.questionId || typeof a.answer !== 'string' || !a.answer.trim())
  if (invalid) throw new Error('All answers must be non-empty strings')

  const submittedIds = answers.map(a => a.questionId)
  const uniqueIds = new Set(submittedIds)
  if (uniqueIds.size !== submittedIds.length) throw new Error('Duplicate answers for the same question')

  const validIds = new Set(expectedQuestions.map(q => q.id))
  const unknown = submittedIds.filter(id => !validIds.has(id))
  if (unknown.length > 0) throw new Error('Answers contain unknown question IDs')
  if (submittedIds.length !== expectedQuestions.length) throw new Error('Must answer all questions')

  await db.$transaction(async tx => {
    const updated = await tx.reviewAssignment.updateMany({
      where: { id: assignmentId, submitted: false },
      data: { submitted: true, submittedAt: new Date() },
    })
    if (updated.count === 0) throw new Error('Already submitted')

    await tx.reviewResponse.createMany({
      data: answers.map(a => ({
        cycleId: assignment.cycleId,
        revieweeId: assignment.revieweeId,
        questionId: null,
        cycleQuestionId: a.questionId,
        answerEncrypted: encrypt(a.answer),
        relationship: assignment.relationship,
      })),
    })
  })

  notifyAdminIfCycleComplete(assignment.cycle.orgId, assignment.cycleId).catch(() => {})
}
