import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/org-context'
import { getAssignmentWithQuestions } from '@/lib/services/reviews'
import ReviewForm from '@/components/dashboard/ReviewForm'

export default async function OrgReviewPage({
  params,
}: {
  params: Promise<{ slug: string; assignmentId: string }>
}) {
  const { slug, assignmentId } = await params
  const { employee } = await getOrgContext(slug)

  const data = await getAssignmentWithQuestions(assignmentId, employee.id)

  if (!data || data.assignment.submitted || data.assignment.cycle.status !== 'ACTIVE') {
    redirect(`/org/${slug}/dashboard`)
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '32px 24px' }}>
      <ReviewForm
        assignmentId={assignmentId}
        revieweeName={data.assignment.reviewee.name}
        cycleTitle={data.assignment.cycle.title}
        questions={data.questions}
        orgSlug={slug}
      />
    </div>
  )
}
