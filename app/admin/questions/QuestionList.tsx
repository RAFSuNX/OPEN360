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

function TypeCards({ value, onChange }: { value: 'RATING' | 'OPEN_TEXT'; onChange: (v: 'RATING' | 'OPEN_TEXT') => void }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {([
        { value: 'RATING', label: 'Rating 1-5', desc: 'Numeric score, averaged across reviewers' },
        { value: 'OPEN_TEXT', label: 'Written response', desc: 'Free text, shown as anonymous quotes' },
      ] as const).map(opt => (
        <label key={opt.value} style={{
          flex: 1, padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
          border: `1px solid ${value === opt.value ? 'var(--primary)' : 'var(--hairline-strong)'}`,
          background: value === opt.value ? '#fef0eb' : 'var(--surface-card)',
          transition: 'border-color 0.15s, background 0.15s',
        }}>
          <input type="radio" name={`type-${opt.value}`} value={opt.value} checked={value === opt.value}
            onChange={() => onChange(opt.value)} style={{ display: 'none' }} />
          <p style={{ fontSize: '13px', fontWeight: '600', color: value === opt.value ? 'var(--primary)' : 'var(--ink)', margin: '0 0 2px' }}>{opt.label}</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>{opt.desc}</p>
        </label>
      ))}
    </div>
  )
}

export function QuestionList({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // New question form state
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<'RATING' | 'OPEN_TEXT'>('RATING')
  const [newCategory, setNewCategory] = useState('')
  const [addError, setAddError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit form state
  const [editText, setEditText] = useState('')
  const [editType, setEditType] = useState<'RATING' | 'OPEN_TEXT'>('RATING')
  const [editCategory, setEditCategory] = useState('')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [toggleError, setToggleError] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/questions')
      if (res.ok) setQuestions(await res.json())
    } catch { /* keep stale */ }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!newText.trim()) { setAddError('Question text is required.'); return }
    if (!newCategory.trim()) { setAddError('Category is required.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim(), type: newType, category: newCategory.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setAddError(d.error ?? 'Failed'); return }
      setNewText(''); setNewCategory(''); setNewType('RATING'); setShowForm(false)
      await refresh()
    } finally { setSubmitting(false) }
  }

  function openEdit(q: Question) {
    setEditingId(q.id); setEditText(q.text); setEditType(q.type); setEditCategory(q.category); setEditError('')
  }

  async function handleSaveEdit(id: string) {
    setEditError('')
    if (!editText.trim()) { setEditError('Question text is required.'); return }
    if (!editCategory.trim()) { setEditError('Category is required.'); return }
    setEditSaving(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text: editText.trim(), type: editType, category: editCategory.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? 'Failed'); return }
      setEditingId(null)
      await refresh()
    } finally { setEditSaving(false) }
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

  function QuestionCard({ q, index }: { q: Question; index?: number }) {
    const isEditing = editingId === q.id

    return (
      <div key={q.id} className="card" style={{ padding: '16px 20px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p className="section-label" style={{ margin: 0 }}>Editing question</p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ink)', marginBottom: '4px' }}>Question text</label>
              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} autoFocus />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>Answer type</label>
              <TypeCards value={editType} onChange={setEditType} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--ink)', marginBottom: '4px' }}>Category</label>
              <input value={editCategory} onChange={e => setEditCategory(e.target.value)}
                placeholder="e.g. Communication" style={inputStyle} list="edit-category-suggestions" />
              <datalist id="edit-category-suggestions">
                {CATEGORY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {editError && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', margin: 0 }}>{editError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleSaveEdit(q.id)} disabled={editSaving} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                {editSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ fontSize: '13px', padding: '7px 16px' }}>
                Cancel
              </button>
              <button onClick={() => handleToggle(q.id, !q.isActive)}
                style={{ fontSize: '12px', color: q.isActive ? 'var(--muted)' : 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                {q.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {index !== undefined && (
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-soft)', fontFamily: "'JetBrains Mono', monospace", minWidth: '24px', paddingTop: '2px' }}>
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', color: 'var(--ink)', margin: '0 0 6px', lineHeight: '1.5' }}>{q.text}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                <span className="badge">{q.category}</span>
                <span className="badge" style={{ background: q.type === 'RATING' ? '#fef0eb' : '#f0f0ff', color: q.type === 'RATING' ? 'var(--primary)' : '#6b6b99' }}>
                  {q.type === 'RATING' ? `Rating 1-${q.ratingScale ?? 5}` : 'Written'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => openEdit(q)}
                style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                Edit
              </button>
              {q.isActive ? (
                <button onClick={() => handleToggle(q.id, false)}
                  style={{ fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Deactivate
                </button>
              ) : (
                <button onClick={() => handleToggle(q.id, true)}
                  style={{ fontSize: '12px', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                  Activate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Review Questions</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>Questions</h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              {active.length} active question{active.length !== 1 ? 's' : ''} shown to reviewers in every cycle
            </p>
          </div>
          <button onClick={() => { setShowForm(s => !s); setAddError('') }} className={showForm ? 'btn-secondary' : 'btn-primary'} style={{ flexShrink: 0 }}>
            {showForm ? 'Cancel' : '+ Add Question'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '32px', maxWidth: '600px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 4px' }}>New question</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
            Active questions appear in all review cycles. Write in third person.
          </p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>
                Question text <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <textarea value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="e.g. How effectively does this person communicate ideas and updates?"
                rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '6px' }}>
                Answer type <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <TypeCards value={newType} onChange={setNewType} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px' }}>
                Category <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. Communication" style={inputStyle} list="category-suggestions" />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            {addError && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', margin: 0 }}>{addError}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add question'}</button>
              <button type="button" onClick={() => { setShowForm(false); setAddError('') }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {toggleError && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginBottom: '12px' }}>{toggleError}</p>}

      {active.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Active ({active.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {active.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: '6px' }}>Inactive ({inactive.length})</p>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
            Hidden from reviewers. Edit or activate to include in future cycles.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {inactive.map(q => <QuestionCard key={q.id} q={q} />)}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 8px' }}>No questions yet.</p>
          <p style={{ fontSize: '12px', color: 'var(--muted-soft)', margin: 0 }}>Click "+ Add Question" above to create your first one.</p>
        </div>
      )}
    </div>
  )
}
