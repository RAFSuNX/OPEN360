import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getAssignmentWithQuestions } from '@/lib/services/reviews'
import ReviewForm from '@/components/dashboard/ReviewForm'

export default async function ReviewPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireAuth()
  const { assignmentId } = await params

  const data = await getAssignmentWithQuestions(assignmentId, session.user.id)

  if (!data || data.assignment.submitted || data.assignment.cycle.status !== 'ACTIVE') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <ReviewForm
        assignmentId={assignmentId}
        revieweeName={data.assignment.reviewee.name}
        cycleTitle={data.assignment.cycle.title}
        questions={data.questions}
      />
    </div>
  )
}
