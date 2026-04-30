'use client'
import { useState } from 'react'

interface Question {
  id: string
  text: string
  type: 'RATING' | 'OPEN_TEXT'
  category: string
  ratingScale: number | null
  sortOrder: number
  isActive: boolean
}

export function QuestionList({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [text, setText] = useState('')
  const [type, setType] = useState<'RATING' | 'OPEN_TEXT'>('RATING')
  const [category, setCategory] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toggleError, setToggleError] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/questions')
      if (res.ok) setQuestions(await res.json())
    } catch {
      // silently keep stale data
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!text.trim() || !category.trim()) {
      setError('Text and category are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          type,
          category: category.trim(),
          sortOrder: sortOrder ? parseInt(sortOrder, 10) : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create question.')
        return
      }
      setText('')
      setCategory('')
      setSortOrder('')
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setToggleError('')
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })
      if (res.ok) await refresh()
      else setToggleError('Failed to update question status.')
    } catch {
      setToggleError('Network error. Please try again.')
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="bg-white border rounded-lg p-4 mb-6 flex flex-col gap-3 max-w-xl">
        <h2 className="font-semibold text-gray-700">Add Question</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Question text"
          value={text}
          onChange={e => setText(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          required
        />
        <div className="flex gap-3">
          <select
            value={type}
            onChange={e => setType(e.target.value as 'RATING' | 'OPEN_TEXT')}
            className="border rounded px-3 py-2 text-sm flex-1"
          >
            <option value="RATING">Rating</option>
            <option value="OPEN_TEXT">Open Text</option>
          </select>
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border rounded px-3 py-2 text-sm flex-1"
            required
          />
          <input
            type="number"
            placeholder="Sort order"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-28"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary" style={{ alignSelf: "flex-start" }}
        >
          {submitting ? 'Adding...' : 'Add Question'}
        </button>
      </form>

      {toggleError && <p className="text-red-500 text-sm mb-2">{toggleError}</p>}
      <div className="flex flex-col gap-2">
        {questions.map(q => (
          <div
            key={q.id}
            className={`bg-white border rounded-lg p-4 flex items-start justify-between gap-4 ${!q.isActive ? 'opacity-50' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{q.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                {q.category} - {q.type === 'RATING' ? `Rating (1-${q.ratingScale ?? 5})` : 'Open Text'} - order: {q.sortOrder}
              </p>
            </div>
            <button
              onClick={() => handleToggle(q.id, !q.isActive)}
              className={`text-xs rounded px-3 py-1 font-medium border whitespace-nowrap ${
                q.isActive
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'border-green-400 text-green-600 hover:bg-green-50'
              }`}
            >
              {q.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No questions yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
