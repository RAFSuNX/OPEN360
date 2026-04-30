'use client'
import { useState } from 'react'

interface Manager { id: string; name: string }
interface Props { managers: Manager[]; onSuccess: () => void }

const inputStyle = {
  width: '100%', background: 'var(--surface-card)', color: 'var(--ink)',
  border: '1px solid var(--hairline-strong)', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
}

export function EmployeeForm({ managers, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', email: '', employeeId: '', department: '', role: '', managerId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ name: '', email: '', employeeId: '', department: '', role: '', managerId: '' })
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add employee')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '20px', minWidth: '280px' }}>
      <p className="section-label" style={{ marginBottom: '16px' }}>Add Employee</p>
      {error && <p className="text-error" style={{ marginBottom: '12px' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input required placeholder="Full name" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input required type="email" placeholder="Email address" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
        <input placeholder="Employee ID (e.g. EMP001)" value={form.employeeId}
          onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={inputStyle} />
        <input placeholder="Department" value={form.department}
          onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
        <input placeholder="Role / Title" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} />
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', letterSpacing: '0.88px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '4px' }}>Reports to</label>
        <select value={form.managerId}
          onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} style={inputStyle}>
          <option value="">- None -</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '4px' }}>
          {loading ? 'Adding...' : 'Add Employee'}
        </button>
      </div>
    </form>
  )
}
