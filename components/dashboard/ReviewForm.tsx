'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  text: string
  type: 'RATING' | 'OPEN_TEXT'
  ratingScale: number | null
  category: string
  sortOrder: number
}

interface Props {
  assignmentId: string
  revieweeName: string
  cycleTitle: string
  questions: Question[]
}

export default function ReviewForm({ assignmentId, revieweeName, cycleTitle, questions }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const unanswered = questions.filter(q => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Submission failed')
        return
      }

      setSubmitted(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <p className="text-green-600 font-medium text-lg">Review submitted. Thank you!</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Review for {revieweeName}</h1>
        <p className="text-gray-500 mt-1">{cycleTitle}</p>
        <p className="text-sm text-blue-600 mt-1">Your responses are completely anonymous.</p>
      </div>

      {questions.map(q => (
        <div key={q.id} className="space-y-2">
          <label className="block font-medium text-gray-800">{q.text}</label>

          {q.type === 'RATING' && (
            <div className="flex gap-4">
              {Array.from({ length: q.ratingScale ?? 5 }, (_, i) => i + 1).map(n => (
                <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    value={String(n)}
                    checked={answers[q.id] === String(n)}
                    onChange={() => setAnswer(q.id, String(n))}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{n}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'OPEN_TEXT' && (
            <textarea
              rows={4}
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your answer..."
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
