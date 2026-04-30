'use client'
import { useState } from 'react'

interface Manager { id: string; name: string }
interface Props { managers: Manager[]; onSuccess: () => void }

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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 border rounded-lg">
      <h2 className="font-semibold text-sm">Add Employee</h2>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <input required placeholder="Full name" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border rounded p-2 text-sm" />
      <input required type="email" placeholder="Email" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="w-full border rounded p-2 text-sm" />
      <input placeholder="Employee ID (e.g. EMP001)" value={form.employeeId}
        onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
        className="w-full border rounded p-2 text-sm" />
      <input placeholder="Department" value={form.department}
        onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
        className="w-full border rounded p-2 text-sm" />
      <input placeholder="Role/Title" value={form.role}
        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        className="w-full border rounded p-2 text-sm" />
      <select value={form.managerId}
        onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
        className="w-full border rounded p-2 text-sm">
        <option value="">No manager</option>
        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Adding...' : 'Add Employee'}
      </button>
    </form>
  )
}
