'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

const inputStyle = {
  background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export default function TemplateActions() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to create', 'error'); return }
      toast(`Template "${name}" created`, 'success')
      setName(''); setShowForm(false)
      router.push(`/admin/templates/${data.id}`)
    } finally { setCreating(false) }
  }

  return (
    <div>
      {showForm ? (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Template name" required autoFocus style={{ ...inputStyle, width: '200px' }} />
          <button type="submit" disabled={creating} className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
            {creating ? 'Creating...' : 'Create'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} style={{ padding: '8px 14px', fontSize: '13px' }}>
            Cancel
          </button>
        </form>
      ) : (
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>
          New Template
        </button>
      )}
    </div>
  )
}

export function TemplateCopyButton({ templateId }: { templateId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [copying, setCopying] = useState(false)

  async function handleCopy() {
    setCopying(true)
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/copy`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to copy', 'error'); return }
      toast('Template copied', 'success')
      router.push(`/admin/templates/${data.id}`)
    } finally { setCopying(false) }
  }

  return (
    <button className="btn-secondary" onClick={handleCopy} disabled={copying} style={{ padding: '6px 14px', fontSize: '13px' }}>
      {copying ? 'Copying...' : 'Copy'}
    </button>
  )
}

export function TemplateDeleteButton({ templateId, templateName }: { templateId: string; templateName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [stage, setStage] = useState<0 | 1>(0)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast(data.error ?? 'Failed to delete', 'error'); setStage(0); return }
      toast(`"${templateName}" deleted`, 'default')
      router.refresh()
    } finally { setDeleting(false) }
  }

  if (stage === 0) {
    return (
      <button className="btn-secondary" onClick={() => setStage(1)} style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--muted)' }}>
        Delete
      </button>
    )
  }

  return (
    <button onClick={deleting ? undefined : handleDelete} disabled={deleting}
      style={{ padding: '6px 14px', fontSize: '13px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--semantic-error)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
      {deleting ? 'Deleting...' : 'Sure?'}
    </button>
  )
}
