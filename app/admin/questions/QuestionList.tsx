'use client'
import { useState } from 'react'

interface Question {
  id: string; text: string; type: 'RATING' | 'OPEN_TEXT'
  category: string; ratingScale: number | null; sortOrder: number; isActive: boolean
}

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
}

const CATEGORY_SUGGESTIONS = ['Communication', 'Collaboration', 'Leadership', 'Problem Solving', 'Growth', 'Technical Skills', 'Attitude', 'Delivery']

export function QuestionList({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<'RATING' | 'OPEN_TEXT'>('RATING')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toggleError, setToggleError] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/questions')
      if (res.ok) setQuestions(await res.json())
    } catch { /* keep stale */ }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!text.trim()) { setError('Question text is required.'); return }
    if (!category.trim()) { setError('Category is required.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type, category: category.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to create question.'); return }
      setText(''); setCategory(''); setType('RATING'); setShowForm(false)
      await refresh()
    } finally { setSubmitting(false) }
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
      else setToggleError('Failed to update question.')
    } catch { setToggleError('Network error. Please try again.') }
  }

  const active = questions.filter(q => q.isActive)
  const inactive = questions.filter(q => !q.isActive)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Review Questions</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>Questions</h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              {active.length} active question{active.length !== 1 ? 's' : ''} - shown to reviewers in every review cycle
            </p>
          </div>
          <button onClick={() => { setShowForm(s => !s); setError('') }} className={showForm ? 'btn-secondary' : 'btn-primary'} style={{ flexShrink: 0 }}>
            {showForm ? 'Cancel' : '+ Add Question'}
          </button>
        </div>
      </div>

      {/* Add form - shown only when opened */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px', maxWidth: '600px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 4px' }}>New question</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
            Questions appear in all review cycles. Active questions are shown to every reviewer.
          </p>

          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Question text */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>
                Question text <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. How effectively does this person communicate ideas and updates?"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }}
                autoFocus
              />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Write in third person - the reviewer reads this about the person being reviewed.
              </p>
            </div>

            {/* Type */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '8px' }}>
                Answer type <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {([
                  { value: 'RATING', label: 'Rating 1-5', desc: 'Numeric score, averaged across reviewers' },
                  { value: 'OPEN_TEXT', label: 'Written response', desc: 'Free text, shown as anonymous quotes' },
                ] as const).map(opt => (
                  <label key={opt.value} style={{
                    flex: 1, padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: `1px solid ${type === opt.value ? 'var(--primary)' : 'var(--hairline-strong)'}`,
                    background: type === opt.value ? '#fef0eb' : 'var(--surface-card)',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                    <input type="radio" name="type" value={opt.value} checked={type === opt.value}
                      onChange={() => setType(opt.value)} style={{ display: 'none' }} />
                    <p style={{ fontSize: '13px', fontWeight: '600', color: type === opt.value ? 'var(--primary)' : 'var(--ink)', margin: '0 0 3px' }}>{opt.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>{opt.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>
                Category <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Communication"
                style={inputStyle}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Groups related questions together in results. Use existing categories to keep things organized.
              </p>
            </div>

            {error && <p style={{ fontSize: '13px', color: 'var(--semantic-error)' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Adding...' : 'Add question'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {toggleError && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginBottom: '12px' }}>{toggleError}</p>}

      {/* Active questions */}
      {active.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Active ({active.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {active.map((q, i) => (
              <div key={q.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-soft)', fontFamily: "'JetBrains Mono', monospace", minWidth: '24px', paddingTop: '2px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', color: 'var(--ink)', margin: '0 0 6px', lineHeight: '1.5' }}>{q.text}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                    <span className="badge">{q.category}</span>
                    <span className="badge" style={{ background: q.type === 'RATING' ? '#fef0eb' : '#f0f0ff', color: q.type === 'RATING' ? 'var(--primary)' : '#6b6b99' }}>
                      {q.type === 'RATING' ? `Rating 1-${q.ratingScale ?? 5}` : 'Written'}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleToggle(q.id, false)}
                  style={{ fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, paddingTop: '2px' }}>
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive questions */}
      {inactive.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: '8px' }}>Inactive ({inactive.length})</p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
            These questions are hidden from reviewers. Activate them to include in future cycles.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {inactive.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'var(--canvas-soft)', borderRadius: '8px', border: '1px solid var(--hairline-soft)', opacity: 0.7 }}>
                <p style={{ fontSize: '13px', color: 'var(--body)', flex: 1, margin: 0 }}>{q.text}</p>
                <span className="badge" style={{ fontSize: '10px' }}>{q.category}</span>
                <button onClick={() => handleToggle(q.id, true)}
                  style={{ fontSize: '12px', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, fontWeight: '500' }}>
                  Activate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 12px' }}>No questions yet.</p>
          <p style={{ fontSize: '12px', color: 'var(--muted-soft)', margin: 0 }}>Add your first question above to get started.</p>
        </div>
      )}
    </div>
  )
}
