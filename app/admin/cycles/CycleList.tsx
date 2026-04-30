'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CycleStatus } from '@prisma/client'

interface Cycle {
  id: string; title: string
  startDate: Date | string; endDate: Date | string
  status: CycleStatus; createdAt: Date | string
}

const statusStyles: Record<CycleStatus, { background: string; color: string }> = {
  DRAFT: { background: '#f3f3f0', color: 'var(--muted)' },
  ACTIVE: { background: '#d1f0e7', color: 'var(--semantic-success)' },
  CLOSED: { background: 'var(--surface-strong)', color: 'var(--body)' },
}

const inputStyle = {
  background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function CycleList({ initialCycles }: { initialCycles: Cycle[] }) {
  const router = useRouter()
  const [cycles, setCycles] = useState(initialCycles)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      const res = await fetch('/api/admin/cycles')
      if (res.ok) setCycles(await res.json())
    } catch { /* keep stale */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setCreating(true)
    try {
      const res = await fetch('/api/admin/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startDate, endDate }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to create cycle'); return }
      setTitle(''); setStartDate(''); setEndDate('')
      await refresh()
    } finally { setCreating(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Review Cycles</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>Cycles</h1>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '28px', maxWidth: '640px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)', margin: '0 0 16px' }}>Create new cycle</p>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Title</label>
            <input style={inputStyle} placeholder="e.g. Q1 2025 Review" value={title}
              onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Start date</label>
            <input type="date" style={inputStyle} value={startDate}
              onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>End date</label>
            <input type="date" style={inputStyle} value={endDate}
              onChange={e => setEndDate(e.target.value)} required />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create Cycle'}
          </button>
        </form>
        {error && <p style={{ fontSize: '13px', color: 'var(--semantic-error)', marginTop: '10px' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {cycles.map(cycle => (
          <div key={cycle.id} onClick={() => router.push(`/admin/cycles/${cycle.id}`)}
            className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px' }}>{cycle.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <span style={{ ...statusStyles[cycle.status], fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', padding: '3px 10px', borderRadius: '9999px', flexShrink: 0 }}>
              {cycle.status}
            </span>
          </div>
        ))}
        {cycles.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No cycles yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
