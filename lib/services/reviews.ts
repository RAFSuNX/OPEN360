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

  if (cycleQuestions.length > 0) {
    const questions = cycleQuestions.map(q => ({
      ...q,
      text: (isSelf && q.selfText) ? q.selfText : q.text,
    }))
    return { assignment, questions }
  }

  // Legacy fallback: scoped to this org only
  const questions = await db.question.findMany({
    where: { isActive: true, orgId: assignment.cycle.orgId, OR: roleFilter },
    orderBy: { sortOrder: 'asc' },
  })

  return {
    assignment,
    questions: questions.map(q => ({ ...q, text: (isSelf && q.selfText) ? q.selfText : q.text })),
  }
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

  const cycleQuestions = await db.cycleQuestion.findMany({
    where: { cycleId: assignment.cycleId, OR: roleFilter },
    select: { id: true },
  })
  const useCycleQuestions = cycleQuestions.length > 0

  const invalid = answers.find(a => !a.questionId || typeof a.answer !== 'string' || !a.answer.trim())
  if (invalid) throw new Error('All answers must be non-empty strings')

  const submittedIds = answers.map(a => a.questionId)
  const uniqueIds = new Set(submittedIds)
  if (uniqueIds.size !== submittedIds.length) throw new Error('Duplicate answers for the same question')

  if (useCycleQuestions) {
    const validIds = new Set(cycleQuestions.map(q => q.id))
    const unknown = submittedIds.filter(id => !validIds.has(id))
    if (unknown.length > 0) throw new Error('Answers contain unknown question IDs')
    if (submittedIds.length !== cycleQuestions.length) throw new Error('Must answer all questions')
  } else {
    const activeQuestions = await db.question.findMany({
      where: { isActive: true, orgId: assignment.cycle.orgId, OR: roleFilter },
      select: { id: true },
    })
    const activeIds = new Set(activeQuestions.map(q => q.id))
    const unknown = submittedIds.filter(id => !activeIds.has(id))
    if (unknown.length > 0) throw new Error('Answers contain unknown or inactive question IDs')
    if (submittedIds.length !== activeQuestions.length) throw new Error('Must answer all active questions')
  }

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
        questionId: useCycleQuestions ? null : a.questionId,
        cycleQuestionId: useCycleQuestions ? a.questionId : null,
        answerEncrypted: encrypt(a.answer),
        relationship: assignment.relationship,
      })),
    })
  })

  notifyAdminIfCycleComplete(assignment.cycle.orgId, assignment.cycleId).catch(() => {})
}
