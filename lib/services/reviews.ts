import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'

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
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, status: true } },
    },
  })

  if (!assignment || assignment.reviewerId !== reviewerId) return null

  const questions = await db.question.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { assignment, questions }
}

export async function submitReview(
  assignmentId: string,
  reviewerId: string,
  answers: { questionId: string; answer: string }[]
) {
  const assignment = await db.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: { cycle: { select: { status: true } } },
  })

  if (!assignment || assignment.reviewerId !== reviewerId) {
    throw new Error('Assignment not found')
  }
  if (assignment.submitted) throw new Error('Already submitted')
  if (assignment.cycle.status !== 'ACTIVE') throw new Error('Cycle is not active')

  const invalid = answers.find(a => !a.questionId || typeof a.answer !== 'string' || !a.answer.trim())
  if (invalid) throw new Error('All answers must be non-empty strings')

  // Store encrypted responses - NO reviewerId stored (anonymity)
  await db.reviewResponse.createMany({
    data: answers.map(a => ({
      cycleId: assignment.cycleId,
      revieweeId: assignment.revieweeId,
      questionId: a.questionId,
      answerEncrypted: encrypt(a.answer),
      relationship: assignment.relationship,
    })),
  })

  await db.reviewAssignment.update({
    where: { id: assignmentId },
    data: { submitted: true, submittedAt: new Date() },
  })
}
