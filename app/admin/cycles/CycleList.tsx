'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CycleStatus } from '@prisma/client'

interface Cycle {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string
  status: CycleStatus
  createdAt: Date | string
}

const statusStyles: Record<CycleStatus, { background: string; color: string }> = {
  DRAFT: { background: '#f3f3f0', color: 'var(--muted)' },
  ACTIVE: { background: '#d1f0e7', color: 'var(--semantic-success)' },
  CLOSED: { background: 'var(--surface-strong)', color: 'var(--body)' },
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
    } catch {
      // silently keep stale data
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const res = await fetch('/api/admin/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startDate, endDate }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create cycle')
        return
      }
      setTitle('')
      setStartDate('')
      setEndDate('')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Title</label>
          <input
            className="border rounded px-3 py-2 text-sm w-56"
            placeholder="Q1 2025 Review"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Start Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">End Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'New Cycle'}
        </button>
        {error && <p className="text-red-500 text-sm w-full">{error}</p>}
      </form>

      <div className="space-y-2">
        {cycles.map(cycle => (
          <div
            key={cycle.id}
            onClick={() => router.push(`/admin/cycles/${cycle.id}`)}
            className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-sm">{cycle.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
              </p>
            </div>
            <span style={{ ...statusStyles[cycle.status], fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', padding: '3px 10px', borderRadius: '9999px' }}>
              {cycle.status}
            </span>
          </div>
        ))}
        {cycles.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No cycles yet. Create one above.</p>
        )}
      </div>
    </div>
  )
}
