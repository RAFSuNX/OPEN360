'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CycleStatus, Relationship } from '@prisma/client'

interface Cycle {
  id: string; title: string
  startDate: Date | string; endDate: Date | string; status: CycleStatus
}

interface Assignment {
  id: string; revieweeId: string; reviewerId: string
  relationship: Relationship; submitted: boolean
  reviewee: { name: string; email: string }
  reviewer: { name: string; email: string }
}

const statusBadge: Record<CycleStatus, { bg: string; color: string }> = {
  DRAFT: { bg: '#f3f3f0', color: 'var(--muted)' },
  ACTIVE: { bg: '#d1f0e7', color: 'var(--semantic-success)' },
  CLOSED: { bg: 'var(--surface-strong)', color: 'var(--body)' },
}

export function CycleDetail({ cycle: initialCycle, initialAssignments }: { cycle: Cycle; initialAssignments: Assignment[] }) {
  const router = useRouter()
  const [cycle, setCycle] = useState(initialCycle)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [loading, setLoading] = useState(false)
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function refreshAssignments() {
    const res = await fetch(`/api/admin/assignments?cycleId=${cycle.id}`)
    if (res.ok) setAssignments(await res.json())
  }

  async function doAction(action: string) {
    setLoading(true); setMessage(null)
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId: cycle.id, action }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ text: data.error ?? 'Action failed', type: 'error' }); return }
      if (action === 'auto-assign') { setMessage({ text: `Assigned ${data.assigned} reviewer pairs.`, type: 'success' }); await refreshAssignments() }
      else if (action === 'activate') { setMessage({ text: `Cycle activated. ${data.emailsSent} invite emails sent.`, type: 'success' }); setCycle(c => ({ ...c, status: CycleStatus.ACTIVE })) }
      else if (action === 'close') { setMessage({ text: `Cycle closed. ${data.emailsSent} result emails sent.`, type: 'success' }); setCycle(c => ({ ...c, status: CycleStatus.CLOSED })) }
      else if (action === 're-open') { setMessage({ text: 'Cycle re-opened. Pending reviewers can now submit.', type: 'success' }); setCycle(c => ({ ...c, status: CycleStatus.ACTIVE })) }
    } finally { setLoading(false) }
  }

  async function sendReminderToAssignment(assignmentId: string, reviewerEmail: string) {
    setRemindingId(assignmentId)
    try {
      const res = await fetch(`/api/admin/assignments/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      const data = await res.json()
      setMessage(res.ok
        ? { text: `Reminder sent to ${reviewerEmail}`, type: 'success' }
        : { text: data.error ?? 'Failed to send reminder', type: 'error' }
      )
    } finally { setRemindingId(null) }
  }

  async function removeAssignment(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/assignments?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) setAssignments(a => a.filter(x => x.id !== id))
    } finally { setLoading(false) }
  }

  const submitted = assignments.filter(a => a.submitted).length
  const total = assignments.length
  const badge = statusBadge[cycle.status]
  const pendingCount = assignments.filter(a => !a.submitted).length
  const reviewees = [...new Map(assignments.map(a => [a.revieweeId, a.reviewee])).entries()]

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Review Cycle</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: '0 0 4px' }}>{cycle.title}</h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Ends {new Date(cycle.endDate).toLocaleDateString()}
            </p>
          </div>
          <span style={{ background: badge.bg, color: badge.color, borderRadius: '9999px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>
            {cycle.status}
          </span>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? '#d1f0e7' : '#fde8ec',
          border: `1px solid ${message.type === 'success' ? '#a8ddc6' : '#f5c0cb'}`,
          borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
          fontSize: '13px', color: message.type === 'success' ? 'var(--semantic-success)' : 'var(--semantic-error)',
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {cycle.status === 'DRAFT' && (
          <>
            <button onClick={() => doAction('auto-assign')} disabled={loading} className="btn-secondary">Auto-assign Reviewers</button>
            <button onClick={() => doAction('activate')} disabled={loading || total === 0} className="btn-primary">Activate + Send Emails</button>
          </>
        )}
        {cycle.status === 'ACTIVE' && (
          <button onClick={() => doAction('close')} disabled={loading} className="btn-primary">Close Cycle + Notify</button>
        )}
        {cycle.status === 'CLOSED' && pendingCount > 0 && (
          <button onClick={() => doAction('re-open')} disabled={loading} className="btn-secondary">
            Re-open Cycle ({pendingCount} pending)
          </button>
        )}
      </div>

      {/* Results section for CLOSED cycles */}
      {cycle.status === 'CLOSED' && reviewees.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Results</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reviewees.map(([revieweeId, reviewee]) => {
              const rAssignments = assignments.filter(a => a.revieweeId === revieweeId)
              const done = rAssignments.filter(a => a.submitted).length
              return (
                <div key={revieweeId} className="card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 2px' }}>{reviewee.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{reviewee.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: done < rAssignments.length ? 'var(--semantic-error)' : 'var(--semantic-success)' }}>
                      {done}/{rAssignments.length} submitted
                    </span>
                    <button onClick={() => router.push(`/admin/results/${cycle.id}/${revieweeId}`)}
                      className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                      View Results
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {total > 0 && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          Submission progress: <strong style={{ color: 'var(--ink)' }}>{submitted}/{total}</strong>
          {pendingCount > 0 && <span style={{ color: 'var(--semantic-error)', marginLeft: '8px' }}>{pendingCount} pending</span>}
        </p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Reviewee</th><th>Reviewer</th><th>Relationship</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id}>
              <td style={{ fontWeight: '500', color: 'var(--ink)' }}>{a.reviewee.name}</td>
              <td>
                <div>
                  <p style={{ margin: 0, fontSize: '13px' }}>{a.reviewer.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>{a.reviewer.email}</p>
                </div>
              </td>
              <td><span className="badge" style={{ fontSize: '10px' }}>{a.relationship.replace('_', ' ')}</span></td>
              <td>
                <span style={{ fontSize: '12px', fontWeight: '500', color: a.submitted ? 'var(--semantic-success)' : 'var(--semantic-error)' }}>
                  {a.submitted ? 'Submitted' : 'Pending'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!a.submitted && cycle.status === 'ACTIVE' && (
                    <button
                      onClick={() => sendReminderToAssignment(a.id, a.reviewer.email)}
                      disabled={remindingId === a.id}
                      style={{ fontSize: '11px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                      {remindingId === a.id ? 'Sending...' : 'Remind'}
                    </button>
                  )}
                  {cycle.status === 'DRAFT' && (
                    <button onClick={() => removeAssignment(a.id)} disabled={loading}
                      style={{ fontSize: '11px', color: 'var(--semantic-error)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {assignments.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px', padding: '32px' }}>
          No assignments yet. Use Auto-assign to add reviewers.
        </p>
      )}
    </div>
  )
}
