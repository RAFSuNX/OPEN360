'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string; text: string; type: 'RATING' | 'OPEN_TEXT'
  ratingScale: number | null; category: string; sortOrder: number
}

interface Props {
  assignmentId: string; revieweeName: string; cycleTitle: string; questions: Question[]
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
    if (unanswered.length > 0) { setError('Please answer all questions before submitting.'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] })) }),
      })
      if (!res.ok) { const data = await res.json(); setError(data.error ?? 'Submission failed'); return }
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
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ width: '40px', height: '40px', background: '#d1f0e7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f8a65" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p style={{ fontSize: '18px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.2px' }}>Review submitted</p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Redirecting to dashboard...</p>
      </div>
    )
  }

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>360 Review</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 6px' }}>
          Reviewing {revieweeName}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{cycleTitle} · Your responses are completely anonymous</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.map((q, i) => (
          <div key={q.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-soft)', fontFamily: "'JetBrains Mono', monospace", minWidth: '20px', paddingTop: '2px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <span className="badge" style={{ marginBottom: '8px', fontSize: '10px' }}>{q.category}</span>
                <p style={{ fontSize: '15px', color: 'var(--ink)', margin: '0 0 16px', lineHeight: '1.5' }}>{q.text}</p>

                {q.type === 'RATING' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>1</span>
                    {Array.from({ length: q.ratingScale ?? 5 }, (_, idx) => idx + 1).map(n => (
                      <label key={n} style={{ cursor: 'pointer' }}>
                        <input type="radio" name={q.id} value={String(n)}
                          checked={answers[q.id] === String(n)}
                          onChange={() => setAnswer(q.id, String(n))}
                          style={{ display: 'none' }} />
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          border: `1px solid ${answers[q.id] === String(n) ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                          background: answers[q.id] === String(n) ? 'var(--primary)' : 'var(--surface-card)',
                          color: answers[q.id] === String(n) ? 'var(--on-primary)' : 'var(--body)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '500', transition: 'all 0.1s',
                        }}>{n}</div>
                      </label>
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{q.ratingScale ?? 5}</span>
                  </div>
                )}

                {q.type === 'OPEN_TEXT' && (
                  <textarea rows={4} value={answers[q.id] ?? ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder="Your answer..."
                    style={{
                      width: '100%', background: 'var(--canvas-soft)', color: 'var(--ink)',
                      border: '1px solid var(--hairline)', borderRadius: '8px',
                      padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit',
                      outline: 'none', resize: 'vertical' as const,
                    }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-error" style={{ marginTop: '16px' }}>{error}</p>}

      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {answeredCount}/{questions.length} answered
        </span>
      </div>
    </form>
  )
}
