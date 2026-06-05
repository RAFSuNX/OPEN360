import { requireOrgAdmin } from '@/lib/org-context'
import { listQuestions } from '@/lib/services/questions'
import { QuestionList } from '@/app/admin/questions/QuestionList'

export default async function OrgQuestionsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const questions = await listQuestions(org.id)
  return <QuestionList initialQuestions={questions} />
}
