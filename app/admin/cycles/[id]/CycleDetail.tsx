'use client'
import { useState } from 'react'
import { CycleStatus, Relationship } from '@prisma/client'

interface Cycle {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string
  status: CycleStatus
}

interface Assignment {
  id: string
  revieweeId: string
  reviewerId: string
  relationship: Relationship
  submitted: boolean
  reviewee: { name: string; email: string }
  reviewer: { name: string; email: string }
}

const statusColors: Record<CycleStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-blue-100 text-blue-700',
}

export function CycleDetail({
  cycle: initialCycle,
  initialAssignments,
}: {
  cycle: Cycle
  initialAssignments: Assignment[]
}) {
  const [cycle, setCycle] = useState(initialCycle)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refreshAssignments() {
    const res = await fetch(`/api/admin/assignments?cycleId=${cycle.id}`)
    if (res.ok) setAssignments(await res.json())
  }

  async function doAction(action: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId: cycle.id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? 'Action failed')
        return
      }
      if (action === 'auto-assign') {
        setMessage(`Assigned ${data.assigned} reviewer pairs.`)
        await refreshAssignments()
      } else if (action === 'activate') {
        setMessage(`Cycle activated. ${data.emailsSent} invite emails sent.`)
        setCycle(c => ({ ...c, status: CycleStatus.ACTIVE }))
      } else if (action === 'close') {
        setMessage(`Cycle closed. ${data.emailsSent} result emails sent.`)
        setCycle(c => ({ ...c, status: CycleStatus.CLOSED }))
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeAssignment(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/assignments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) setAssignments(a => a.filter(x => x.id !== id))
    } finally {
      setLoading(false)
    }
  }

  const submitted = assignments.filter(a => a.submitted).length
  const total = assignments.length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{cycle.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ends {new Date(cycle.endDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusColors[cycle.status]}`}>
          {cycle.status}
        </span>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded px-4 py-2 text-sm">
          {message}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        {cycle.status === 'DRAFT' && (
          <>
            <button
              onClick={() => doAction('auto-assign')}
              disabled={loading}
              className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Auto-assign Reviewers
            </button>
            <button
              onClick={() => doAction('activate')}
              disabled={loading || total === 0}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Activate + Send Emails
            </button>
          </>
        )}
        {cycle.status === 'ACTIVE' && (
          <button
            onClick={() => doAction('close')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Close Cycle + Notify
          </button>
        )}
      </div>

      {total > 0 && (
        <p className="text-sm text-gray-600 mb-3">
          Submission progress: <span className="font-medium">{submitted}/{total}</span> submitted
        </p>
      )}

      <table className="w-full bg-white border rounded-lg text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['Reviewee', 'Reviewer', 'Relationship', 'Submitted', ...(cycle.status === 'DRAFT' ? [''] : [])].map(h => (
              <th key={h} className="text-left p-3 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{a.reviewee.name}</td>
              <td className="p-3">{a.reviewer.name}</td>
              <td className="p-3 capitalize">{a.relationship.replace('_', ' ').toLowerCase()}</td>
              <td className="p-3">
                <span className={a.submitted ? 'text-green-600 font-medium' : 'text-gray-400'}>
                  {a.submitted ? 'Yes' : 'No'}
                </span>
              </td>
              {cycle.status === 'DRAFT' && (
                <td className="p-3">
                  <button
                    onClick={() => removeAssignment(a.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {assignments.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No assignments yet. Use Auto-assign to add reviewers.</p>
      )}
    </div>
  )
}
