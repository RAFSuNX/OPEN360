import { requireAdmin } from '@/lib/auth'
import { listQuestions } from '@/lib/services/questions'
import { QuestionList } from './QuestionList'

export default async function QuestionsPage() {
  await requireAdmin()
  const questions = await listQuestions()
  return <QuestionList initialQuestions={questions} />
}
