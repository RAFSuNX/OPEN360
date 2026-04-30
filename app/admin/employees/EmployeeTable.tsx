'use client'
import { useState } from 'react'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { CsvImport } from '@/components/admin/CsvImport'

interface Employee {
  id: string; name: string; email: string
  employeeId: string | null; department: string | null
  role: string | null; manager: { id: string; name: string } | null
}

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function EmployeeTable({ initialEmployees, activeCycles }: {
  initialEmployees: Employee[]
  activeCycles: { id: string; title: string }[]
}) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState({ name: '', employeeId: '', department: '', role: '', managerId: '' })
  const [sendingReview, setSendingReview] = useState<string | null>(null)
  const [selectedCycle, setSelectedCycle] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/employees')
      if (res.ok) setEmployees(await res.json())
    } catch { /* keep stale */ }
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setEditForm({
      name: emp.name,
      employeeId: emp.employeeId ?? '',
      department: emp.department ?? '',
      role: emp.role ?? '',
      managerId: emp.manager?.id ?? '',
    })
    setMsg('')
  }

  async function saveEdit() {
    if (!editing) return
    setSaveLoading(true)
    const res = await fetch('/api/admin/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        name: editForm.name,
        employeeId: editForm.employeeId || null,
        department: editForm.department || null,
        role: editForm.role || null,
        managerId: editForm.managerId || null,
      }),
    })
    if (res.ok) { await refresh(); setEditing(null) }
    setSaveLoading(false)
  }

  async function sendReview(employeeId: string) {
    if (!selectedCycle) return
    setSendingReview(employeeId)
    const res = await fetch(`/api/admin/employees/${employeeId}/send-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleId: selectedCycle }),
    })
    const data = await res.json()
    setMsg(res.ok ? `Sent ${data.sent} review emails` : (data.error ?? 'Failed'))
    setSendingReview(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>People</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Employees
        </h1>
      </div>

      {activeCycles.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <p className="section-label" style={{ margin: 0 }}>Active cycle for send review:</p>
          <select value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}
            style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '13px' }}>
            <option value="">Select cycle</option>
            {activeCycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      )}

      {msg && <p style={{ fontSize: '13px', color: 'var(--semantic-success)', marginBottom: '16px' }}>{msg}</p>}

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
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Manager</th><th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--muted)' }}>
                    {emp.employeeId ?? '—'}
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--ink)' }}>{emp.name}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{emp.email}</td>
                  <td>{emp.department ?? '—'}</td>
                  <td>{emp.role ?? '—'}</td>
                  <td>{emp.manager?.name ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(emp)}
                        style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                        Edit
                      </button>
                      {selectedCycle && (
                        <button onClick={() => sendReview(emp.id)}
                          disabled={sendingReview === emp.id}
                          style={{ fontSize: '12px', color: 'var(--body)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: sendingReview === emp.id ? 0.5 : 1 }}>
                          {sendingReview === emp.id ? 'Sending...' : 'Send review'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px',
        }} onClick={() => setEditing(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>Edit Employee</p>
              <button onClick={() => setEditing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>
              {editing.email}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input placeholder="Full name" value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              <input placeholder="Employee ID (e.g. EMP001)" value={editForm.employeeId}
                onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))} style={inputStyle} />
              <input placeholder="Department" value={editForm.department}
                onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
              <input placeholder="Role / Title" value={editForm.role}
                onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} />
              <select value={editForm.managerId}
                onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))} style={inputStyle}>
                <option value="">No manager</option>
                {employees.filter(e => e.id !== editing.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={saveEdit} disabled={saveLoading} className="btn-primary" style={{ flex: 1 }}>
                  {saveLoading ? 'Saving...' : 'Save changes'}
                </button>
                <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
