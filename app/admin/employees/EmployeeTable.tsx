'use client'
import { useState } from 'react'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { CsvImport } from '@/components/admin/CsvImport'

interface Employee {
  id: string; name: string; email: string
  employeeId: string | null
  department: string | null; role: string | null
  manager: { id: string; name: string } | null
}

export function EmployeeTable({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [editingManager, setEditingManager] = useState<string | null>(null)
  const [selectedManager, setSelectedManager] = useState('')

  async function refresh() {
    try {
      const res = await fetch('/api/admin/employees')
      if (res.ok) setEmployees(await res.json())
    } catch { /* keep stale */ }
  }

  async function saveManager(id: string) {
    const res = await fetch('/api/admin/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, managerId: selectedManager || null }),
    })
    if (res.ok) { await refresh(); setEditingManager(null) }
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>People</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Employees
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>
        <EmployeeForm managers={employees} onSuccess={refresh} />
        <CsvImport onSuccess={refresh} />
      </div>

      {employees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <p style={{ fontSize: '14px' }}>No employees yet. Add one above or import from CSV.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' as const }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Manager</th>
                <th></th>
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
                  <td>
                    {editingManager === emp.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--hairline-strong)', borderRadius: '6px', background: 'var(--surface-card)', color: 'var(--ink)', fontFamily: 'inherit' }}>
                          <option value="">No manager</option>
                          {employees.filter(e => e.id !== emp.id).map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <button onClick={() => saveManager(emp.id)}
                          style={{ fontSize: '12px', color: 'var(--semantic-success)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Save
                        </button>
                        <button onClick={() => setEditingManager(null)}
                          style={{ fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: emp.manager ? 'var(--body)' : 'var(--muted)' }}>
                        {emp.manager?.name ?? '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => { setEditingManager(emp.id); setSelectedManager(emp.manager?.id ?? '') }}
                      style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
