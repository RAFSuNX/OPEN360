import { requireAdmin } from '@/lib/auth'
import { listQuestions } from '@/lib/services/questions'
import { QuestionList } from './QuestionList'

export default async function QuestionsPage() {
  await requireAdmin()
  const questions = await listQuestions()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review Questions</h1>
      <QuestionList initialQuestions={questions} />
    </div>
  )
}
