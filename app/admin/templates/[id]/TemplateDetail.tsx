'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface TemplateItem {
  id: string; text: string; type: 'RATING' | 'OPEN_TEXT'
  ratingScale: number | null; category: string; sortOrder: number
}

interface Template {
  id: string; name: string; description: string | null
  isDefault: boolean; items: TemplateItem[]
}

const inputStyle = {
  background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

const CATEGORIES = ['Communication', 'Collaboration', 'Leadership', 'Problem Solving', 'Accountability', 'Execution', 'Growth', 'Emotional Intelligence', 'Overall']

export default function TemplateDetail({ template: initial }: { template: Template }) {
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState(initial)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(initial.name)
  const [savingName, setSavingName] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ text: '', type: 'RATING' as 'RATING' | 'OPEN_TEXT', ratingScale: 5, category: '' })
  const [savingItem, setSavingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemData, setEditItemData] = useState<Partial<TemplateItem>>({})

  const blocked = template.isDefault

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
        body: JSON.stringify({ ...newItem, sortOrder }),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error, 'error'); return }
      const item = await res.json()
      setTemplate(t => ({ ...t, items: [...t.items, item] }))
      setNewItem({ text: '', type: 'RATING', ratingScale: 5, category: '' })
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
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Question text</label>
              <textarea rows={2} value={newItem.text} onChange={e => setNewItem(p => ({ ...p, text: e.target.value }))} required
                style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Type</label>
                <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as 'RATING' | 'OPEN_TEXT' }))} style={inputStyle}>
                  <option value="RATING">Rating</option>
                  <option value="OPEN_TEXT">Open Text</option>
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Category</label>
                <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} required style={{ ...inputStyle, width: '100%' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
          <div key={item.id} className="card" style={{ padding: '16px 20px' }}>
            {editingItemId === item.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea rows={2} value={editItemData.text ?? item.text}
                  onChange={e => setEditItemData(p => ({ ...p, text: e.target.value }))}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical' as const }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={editItemData.category ?? item.category}
                    onChange={e => setEditItemData(p => ({ ...p, category: e.target.value }))}
                    style={{ ...inputStyle, width: 'auto' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" value={editItemData.sortOrder ?? item.sortOrder}
                    onChange={e => setEditItemData(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                    style={{ ...inputStyle, width: '80px' }} placeholder="Order" />
                  <button className="btn-primary" onClick={() => saveItemEdit(item.id)} style={{ padding: '7px 14px', fontSize: '13px' }}>Save</button>
                  <button className="btn-secondary" onClick={() => setEditingItemId(null)} style={{ padding: '7px 14px', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-soft)', fontFamily: "'JetBrains Mono', monospace", minWidth: '24px', paddingTop: '2px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ fontSize: '10px' }}>{item.category}</span>
                    <span className="badge" style={{ fontSize: '10px', background: item.type === 'RATING' ? 'var(--canvas-soft)' : 'var(--surface-strong)' }}>
                      {item.type === 'RATING' ? `Rating 1-${item.ratingScale}` : 'Open text'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ink)', margin: 0, lineHeight: '1.5' }}>{item.text}</p>
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
