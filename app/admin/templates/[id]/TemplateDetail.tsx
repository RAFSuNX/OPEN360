'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface TemplateItem {
  id: string; text: string; selfText: string | null; type: 'RATING' | 'OPEN_TEXT'
  ratingScale: number | null; category: string; applicableRole: string | null; sortOrder: number
}

interface Template {
  id: string; name: string; description: string | null
  isDefault: boolean; items: TemplateItem[]
}

const CATEGORIES = ['Communication', 'Collaboration', 'Leadership', 'Problem Solving', 'Accountability', 'Execution', 'Growth', 'Emotional Intelligence', 'Overall']

const inputStyle = {
  background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export default function TemplateDetail({ template: initial, roles }: { template: Template; roles: string[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState(initial)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(initial.name)
  const [savingName, setSavingName] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ text: '', selfText: '', type: 'RATING' as 'RATING' | 'OPEN_TEXT', ratingScale: 5, category: '', applicableRole: '' })
  const [savingItem, setSavingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemData, setEditItemData] = useState<Partial<TemplateItem>>({})
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const blocked = template.isDefault

  function handleDragStart(idx: number) {
    setDraggingIdx(idx)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (idx !== dragOverIdx) setDragOverIdx(idx)
  }

  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === dropIdx) {
      setDraggingIdx(null); setDragOverIdx(null); return
    }
    const items = [...template.items]
    const [moved] = items.splice(draggingIdx, 1)
    items.splice(dropIdx, 0, moved)
    const reordered = items.map((item, i) => ({ ...item, sortOrder: i }))

    const originalOrders = new Map(template.items.map(item => [item.id, item.sortOrder]))
    const changed = reordered.filter(item => originalOrders.get(item.id) !== item.sortOrder)

    setTemplate(t => ({ ...t, items: reordered }))
    setDraggingIdx(null); setDragOverIdx(null)

    Promise.all(changed.map(item =>
      fetch(`/api/admin/templates/${template.id}/items/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      })
    )).then(() => toast('Order saved', 'success')).catch(() => toast('Failed to save order', 'error'))
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      setTemplate(t => ({ ...t, name }))
      setEditingName(false)
      toast('Template name updated', 'success')
    } finally { setSavingName(false) }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setSavingItem(true)
    const sortOrder = Math.max(0, ...template.items.map(i => i.sortOrder)) + 1
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          selfText: newItem.selfText || null,
          applicableRole: newItem.applicableRole || null,
          sortOrder,
        }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      const item = await res.json()
      setTemplate(t => ({ ...t, items: [...t.items, item] }))
      setNewItem({ text: '', selfText: '', type: 'RATING', ratingScale: 5, category: '', applicableRole: '' })
      setAddingItem(false)
      toast('Question added', 'success')
    } finally { setSavingItem(false) }
  }

  async function saveItemEdit(itemId: string) {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/items/${itemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItemData),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      const updated = await res.json()
      setTemplate(t => ({ ...t, items: t.items.map(i => i.id === itemId ? updated : i).sort((a, b) => a.sortOrder - b.sortOrder) }))
      setEditingItemId(null)
      toast('Question updated', 'success')
    } catch { toast('Update failed', 'error') }
  }

  async function deleteItem(itemId: string) {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      setTemplate(t => ({ ...t, items: t.items.filter(i => i.id !== itemId) }))
      toast('Question removed', 'default')
    } catch { toast('Delete failed', 'error') }
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Question Template</p>
        {editingName && !blocked ? (
          <form onSubmit={saveName} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={name} onChange={e => setName(e.target.value)} required autoFocus
              style={{ ...inputStyle, fontSize: '18px', width: '280px' }} />
            <button type="submit" disabled={savingName} className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              {savingName ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setEditingName(false); setName(template.name) }} style={{ padding: '8px 14px', fontSize: '13px' }}>
              Cancel
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>{template.name}</h1>
            {template.isDefault && <span className="badge" style={{ fontSize: '10px' }}>Default - read only</span>}
            {!blocked && (
              <button onClick={() => setEditingName(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '12px', fontFamily: 'inherit', padding: '4px 8px' }}>
                Rename
              </button>
            )}
          </div>
        )}
        {blocked && (
          <div style={{ marginTop: '12px', background: 'var(--canvas-soft)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--muted)' }}>
            This is the default template and cannot be edited. Use <strong>Copy</strong> on the templates list to create an editable version.
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <p className="section-label">{template.items.length} questions</p>
        {!blocked && (
          <button className="btn-secondary" onClick={() => setAddingItem(!addingItem)} style={{ padding: '7px 14px', fontSize: '13px' }}>
            {addingItem ? 'Cancel' : '+ Add Question'}
          </button>
        )}
      </div>

      {addingItem && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px', background: 'var(--canvas-soft)' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 14px' }}>New Question</p>
          <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 260px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Question text (peer / manager wording)</label>
                <textarea rows={2} value={newItem.text} onChange={e => setNewItem(p => ({ ...p, text: e.target.value }))} required
                  placeholder="[Name] demonstrates..." style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
              </div>
              <div style={{ flex: '2 1 260px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Self-assessment wording <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(shown to reviewer when doing own review)</span></label>
                <textarea rows={2} value={newItem.selfText} onChange={e => setNewItem(p => ({ ...p, selfText: e.target.value }))}
                  placeholder="I demonstrate..." style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Applies to</label>
                <select value={newItem.applicableRole} onChange={e => setNewItem(p => ({ ...p, applicableRole: e.target.value }))} style={inputStyle}>
                  <option value="">All employees</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Type</label>
                <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as 'RATING' | 'OPEN_TEXT' }))} style={inputStyle}>
                  <option value="RATING">Rating</option>
                  <option value="OPEN_TEXT">Open Text</option>
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Category</label>
                <input value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} required
                  placeholder="e.g. Core Values & Culture" style={{ ...inputStyle, width: '100%' }} />
              </div>
              {newItem.type === 'RATING' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Scale</label>
                  <select value={newItem.ratingScale} onChange={e => setNewItem(p => ({ ...p, ratingScale: Number(e.target.value) }))} style={inputStyle}>
                    <option value={5}>1-5</option>
                    <option value={10}>1-10</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <button type="submit" disabled={savingItem} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                {savingItem ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {template.items.map((item, idx) => (
          <div
            key={item.id}
            className="card"
            draggable={!blocked && editingItemId !== item.id}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null) }}
            style={{
              padding: '16px 20px',
              opacity: draggingIdx === idx ? 0.4 : 1,
              borderColor: dragOverIdx === idx && draggingIdx !== idx ? 'var(--primary)' : undefined,
              transition: 'opacity 0.15s, border-color 0.15s',
            }}
          >
            {editingItemId === item.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '2 1 220px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}>Peer / manager wording</label>
                    <textarea rows={2} value={editItemData.text ?? item.text}
                      onChange={e => setEditItemData(p => ({ ...p, text: e.target.value }))}
                      style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
                  </div>
                  <div style={{ flex: '2 1 220px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}>Self-assessment wording</label>
                    <textarea rows={2} value={editItemData.selfText ?? item.selfText ?? ''}
                      onChange={e => setEditItemData(p => ({ ...p, selfText: e.target.value || null }))}
                      placeholder="I..." style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={editItemData.applicableRole !== undefined ? (editItemData.applicableRole ?? '') : (item.applicableRole ?? '')}
                    onChange={e => setEditItemData(p => ({ ...p, applicableRole: e.target.value || null }))}
                    style={{ ...inputStyle, width: 'auto' }}>
                    <option value="">All employees</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input value={editItemData.category ?? item.category}
                    onChange={e => setEditItemData(p => ({ ...p, category: e.target.value }))}
                    style={{ ...inputStyle, width: '160px' }} placeholder="Category" />
                  <input type="number" value={editItemData.sortOrder ?? item.sortOrder}
                    onChange={e => setEditItemData(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                    style={{ ...inputStyle, width: '80px' }} placeholder="Order" />
                  <button className="btn-primary" onClick={() => saveItemEdit(item.id)} style={{ padding: '7px 14px', fontSize: '13px' }}>Save</button>
                  <button className="btn-secondary" onClick={() => setEditingItemId(null)} style={{ padding: '7px 14px', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {!blocked && (
                  <div
                    title="Drag to reorder"
                    style={{ cursor: 'grab', paddingTop: '2px', flexShrink: 0, color: 'var(--muted-soft)', lineHeight: 1 }}
                  >
                    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                      <circle cx="3" cy="3"  r="1.5"/><circle cx="9" cy="3"  r="1.5"/>
                      <circle cx="3" cy="9"  r="1.5"/><circle cx="9" cy="9"  r="1.5"/>
                      <circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
                    </svg>
                  </div>
                )}
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-soft)', fontFamily: "'JetBrains Mono', monospace", minWidth: '24px', paddingTop: '2px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ fontSize: '10px' }}>{item.category}</span>
                    <span className="badge" style={{ fontSize: '10px', background: item.type === 'RATING' ? 'var(--canvas-soft)' : 'var(--surface-strong)' }}>
                      {item.type === 'RATING' ? `Rating 1-${item.ratingScale}` : 'Open text'}
                    </span>
                    {item.applicableRole && (
                      <span className="badge" style={{ fontSize: '10px', background: '#fef0eb', color: 'var(--primary)' }}>
                        {item.applicableRole}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ink)', margin: 0, lineHeight: '1.5' }}>{item.text}</p>
                  {item.selfText && (
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0', lineHeight: '1.4', fontStyle: 'italic' }}>
                      Self: {item.selfText}
                    </p>
                  )}
                </div>
                {!blocked && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => { setEditingItemId(item.id); setEditItemData({}) }}
                      style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', padding: '4px 8px', minHeight: '36px' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      style={{ fontSize: '12px', color: 'var(--semantic-error)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', minHeight: '36px' }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {template.items.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No questions yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
