'use client'
import { useState } from 'react'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { CsvImport } from '@/components/admin/CsvImport'
import { EmployeeProfileModal } from '@/components/EmployeeProfileModal'

interface Employee {
  id: string; name: string; email: string
  employeeId: string | null; department: string | null
  role: string | null; manager: { id: string; name: string } | null
  isAdmin: boolean
}

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function EmployeeTable({ initialEmployees, currentUserId }: { initialEmployees: Employee[]; currentUserId: string }) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [viewingProfile, setViewingProfile] = useState<string | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState({ name: '', employeeId: '', department: '', role: '', managerId: '', isAdmin: false })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Ad-hoc review state
  const [reviewTarget, setReviewTarget] = useState<Employee | null>(null)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewEndDate, setReviewEndDate] = useState('')
  const [reviewerIds, setReviewerIds] = useState<string[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewResult, setReviewResult] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/employees')
      if (res.ok) setEmployees(await res.json())
    } catch { /* keep stale */ }
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setSaveError('')
    setEditForm({ name: emp.name, employeeId: emp.employeeId ?? '', department: emp.department ?? '', role: emp.role ?? '', managerId: emp.manager?.id ?? '', isAdmin: emp.isAdmin })
  }

  async function saveEdit() {
    if (!editing) return
    if (!editForm.name.trim()) { setSaveError('Name is required.'); return }
    setSaveLoading(true); setSaveError('')
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          name: editForm.name.trim(),
          employeeId: editForm.employeeId || null,
          department: editForm.department || null,
          role: editForm.role || null,
          managerId: editForm.managerId || null,
          ...(editing.id !== currentUserId ? { isAdmin: editForm.isAdmin } : {}),
        }),
      })
      if (res.ok) {
        await refresh(); setEditing(null)
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error ?? `Save failed (${res.status})`)
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  function openReview(emp: Employee) {
    setReviewTarget(emp)
    setReviewTitle('')
    setReviewEndDate('')
    setReviewerIds([])
    setReviewResult('')
  }

  function toggleReviewer(id: string) {
    setReviewerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function sendAdhocReview() {
    if (!reviewTarget) return
    setReviewLoading(true)
    setReviewResult('')
    const res = await fetch(`/api/admin/employees/${reviewTarget.id}/adhoc-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: reviewTitle || undefined,
        endDate: reviewEndDate || undefined,
        reviewerIds: reviewerIds.length > 0 ? reviewerIds : undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setReviewResult(`Review created and ${data.sent} email${data.sent !== 1 ? 's' : ''} sent.`)
    } else {
      setReviewResult(data.error ?? 'Failed to create review.')
    }
    setReviewLoading(false)
  }

  const potentialReviewers = reviewTarget ? employees.filter(e => e.id !== reviewTarget.id) : []

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>People</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>Employees</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>
        <EmployeeForm managers={employees} onSuccess={refresh} />
        <CsvImport onSuccess={refresh} />
      </div>

      {employees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <p style={{ fontSize: '14px' }}>No employees yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' as const }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Manager</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--muted)' }}>{emp.employeeId ?? '-'}</td>
                  <td style={{ fontWeight: '500', color: 'var(--ink)' }}>
                    {emp.name}
                    {emp.isAdmin && <span title="Admin" style={{ marginLeft: '6px', fontSize: '12px' }}>&#9733;</span>}
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{emp.email}</td>
                  <td>{emp.department ?? '-'}</td>
                  <td>{emp.role ?? '-'}</td>
                  <td>{emp.manager?.name ?? '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setViewingProfile(emp.id)} style={{ fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                      <button onClick={() => openEdit(emp)} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>Edit</button>
                      <button onClick={() => openReview(emp)} style={{ fontSize: '12px', color: 'var(--body)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Send review</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingProfile && (
        <EmployeeProfileModal employeeId={viewingProfile} onClose={() => setViewingProfile(null)} />
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }} onClick={() => setEditing(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>Edit Employee</p>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>{editing.email}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input placeholder="Full name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              <input placeholder="Employee ID (e.g. EMP001)" value={editForm.employeeId} onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))} style={inputStyle} />
              <input placeholder="Department" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
              <input placeholder="Role / Title" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} />
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px', marginTop: '4px' }}>Reports to</label>
              <select value={editForm.managerId} onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))} style={inputStyle}>
                <option value="">- None -</option>
                {employees.filter(e => e.id !== editing.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {editing.id !== currentUserId && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 0', fontSize: '13px', color: 'var(--ink)' }}>
                  <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm(f => ({ ...f, isAdmin: e.target.checked }))}
                    style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                  Admin access
                </label>
              )}
              {saveError && (
                <p style={{ fontSize: '12px', color: 'var(--semantic-error)', margin: '4px 0 0' }}>{saveError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={saveEdit} disabled={saveLoading} className="btn-primary" style={{ flex: 1 }}>{saveLoading ? 'Saving...' : 'Save changes'}</button>
                <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ad-hoc review modal */}
      {reviewTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }} onClick={() => setReviewTarget(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' as const }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>Send Review Request</p>
              <button onClick={() => setReviewTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Requesting feedback for <strong style={{ color: 'var(--ink)' }}>{reviewTarget.name}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Review title (optional)</p>
                <input placeholder={`Ad-hoc: ${reviewTarget.name}`} value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Deadline (optional, default 7 days)</p>
                <input type="date" value={reviewEndDate} onChange={e => setReviewEndDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                  Select reviewers - or leave all unselected to auto-assign from org tree
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' as const }}>
                  {potentialReviewers.map(e => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: reviewerIds.includes(e.id) ? 'var(--canvas)' : 'transparent', border: `1px solid ${reviewerIds.includes(e.id) ? 'var(--hairline-strong)' : 'transparent'}` }}>
                      <input type="checkbox" checked={reviewerIds.includes(e.id)} onChange={() => toggleReviewer(e.id)}
                        style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                      <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{e.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>{e.role ?? ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              {reviewResult && (
                <p style={{ fontSize: '13px', color: reviewResult.includes('sent') ? 'var(--semantic-success)' : 'var(--semantic-error)' }}>
                  {reviewResult}
                </p>
              )}

              <button onClick={sendAdhocReview} disabled={reviewLoading} className="btn-primary" style={{ marginTop: '4px' }}>
                {reviewLoading ? 'Creating...' : 'Create review & send emails'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
