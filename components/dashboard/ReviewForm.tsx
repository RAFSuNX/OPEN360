'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface Question {
  id: string; text: string; type: 'RATING' | 'OPEN_TEXT'
  ratingScale: number | null; category: string; sortOrder: number
}

interface Props {
  assignmentId: string; revieweeName: string; cycleTitle: string; questions: Question[]
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const pct = max === 0 ? 0 : value / max
  const offset = circ * (1 - pct)
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--hairline-strong)" strokeWidth="3" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--primary)" strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
      <text x="22" y="22" dominantBaseline="middle" textAnchor="middle"
        style={{ transform: 'rotate(90deg) translate(0, -44px)', transformOrigin: '22px 22px', fontSize: '10px', fontWeight: '600', fill: 'var(--ink)', fontFamily: 'Inter, sans-serif' }}>
        {value}/{max}
      </text>
    </svg>
  )
}

export default function ReviewForm({ assignmentId, revieweeName, cycleTitle, questions }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSelected, setJustSelected] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setJustSelected(questionId)
    setTimeout(() => setJustSelected(null), 250)
  }

  function scrollToFirstUnanswered() {
    const unanswered = questions.find(q => !answers[q.id]?.trim())
    if (!unanswered) return
    const el = formRef.current?.querySelector(`[data-qid="${unanswered.id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const unanswered = questions.filter(q => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      setError(`${unanswered.length} question${unanswered.length > 1 ? 's' : ''} still need${unanswered.length === 1 ? 's' : ''} an answer.`)
      scrollToFirstUnanswered()
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] })) }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Submission failed')
        return
      }
      setSubmitted(true)
      toast('Review submitted successfully', 'success')
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch {
      setError('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{
          width: '52px', height: '52px',
          background: 'linear-gradient(135deg, #d1f0e7 0%, #a8e6d0 100%)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 16px rgba(31, 138, 101, 0.2)',
          animation: 'ratingPop 0.4s ease-out',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f8a65" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p style={{ fontSize: '20px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 6px' }}>
          Review submitted
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Redirecting to dashboard...</p>
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px' }}>
          <span className="spinner-muted" />
        </div>
      </div>
    )
  }

  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length
  const categories = [...new Set(questions.map(q => q.category))]

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p className="section-label" style={{ marginBottom: '8px' }}>360 Review</p>
          <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 6px' }}>
            Reviewing {revieweeName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>{cycleTitle} · Your responses are completely anonymous</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <ProgressRing value={answeredCount} max={questions.length} />
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>answered</p>
        </div>
      </div>

      {categories.map(cat => {
        const catQuestions = questions.filter(q => q.category === cat)
        return (
          <div key={cat} style={{ marginBottom: '32px' }}>
            <p className="section-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {cat}
              <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--muted-soft)', textTransform: 'none', letterSpacing: 0 }}>
                {catQuestions.filter(q => answers[q.id]?.trim()).length}/{catQuestions.length}
              </span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {catQuestions.map((q, i) => {
                const globalIdx = questions.indexOf(q)
                const isAnswered = !!answers[q.id]?.trim()
                return (
                  <div key={q.id} data-qid={q.id} className="card stagger-item"
                    style={{
                      padding: '20px',
                      borderColor: isAnswered ? 'var(--hairline-strong)' : 'var(--hairline)',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxShadow: isAnswered ? '0 1px 4px rgba(38,37,30,0.04)' : 'none',
                    }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', color: isAnswered ? 'var(--primary)' : 'var(--muted-soft)',
                        fontFamily: "'JetBrains Mono', monospace", minWidth: '20px', paddingTop: '2px',
                        transition: 'color 0.15s',
                      }}>
                        {String(globalIdx + 1).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', color: 'var(--ink)', margin: '0 0 14px', lineHeight: '1.55' }}>{q.text}</p>

                        {q.type === 'RATING' && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: '2px' }}>Low</span>
                            {Array.from({ length: q.ratingScale ?? 5 }, (_, idx) => idx + 1).map(n => {
                              const sel = answers[q.id] === String(n)
                              return (
                                <label key={n} style={{ cursor: 'pointer' }}>
                                  <input type="radio" name={q.id} value={String(n)}
                                    checked={sel}
                                    onChange={() => setAnswer(q.id, String(n))}
                                    style={{ display: 'none' }} />
                                  <div className={sel && justSelected === q.id ? 'rating-selected' : ''}
                                    style={{
                                      width: '38px', height: '38px', borderRadius: '8px',
                                      border: `1.5px solid ${sel ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                                      background: sel ? 'var(--primary)' : 'var(--surface-card)',
                                      color: sel ? 'var(--on-primary)' : 'var(--body)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '13px', fontWeight: '600',
                                      transition: 'background 0.1s, border-color 0.1s, color 0.1s',
                                      userSelect: 'none',
                                    }}>{n}</div>
                                </label>
                              )
                            })}
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '2px' }}>High</span>
                          </div>
                        )}

                        {q.type === 'OPEN_TEXT' && (
                          <textarea rows={3} value={answers[q.id] ?? ''}
                            onChange={e => setAnswer(q.id, e.target.value)}
                            placeholder="Share a specific example or observation..."
                            style={{
                              width: '100%', background: 'var(--canvas-soft)', color: 'var(--ink)',
                              border: '1px solid var(--hairline)', borderRadius: '8px',
                              padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit',
                              outline: 'none', resize: 'vertical' as const,
                              transition: 'border-color 0.15s',
                            }} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && (
        <div style={{
          background: '#fde8ec', border: '1px solid #f5c0cb', borderRadius: '8px',
          padding: '10px 14px', marginTop: '16px', marginBottom: '4px',
          fontSize: '13px', color: 'var(--semantic-error)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button type="submit" disabled={submitting || answeredCount === 0} className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px', justifyContent: 'center' }}>
          {submitting ? (
            <><span className="spinner" />Submitting...</>
          ) : answeredCount === questions.length ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Submit Review
            </>
          ) : (
            'Submit Review'
          )}
        </button>
        {answeredCount > 0 && answeredCount < questions.length && (
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {questions.length - answeredCount} remaining
          </span>
        )}
        {answeredCount === questions.length && (
          <span style={{ fontSize: '12px', color: 'var(--semantic-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            All answered
          </span>
        )}
      </div>
    </form>
  )
}
