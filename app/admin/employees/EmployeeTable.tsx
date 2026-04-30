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
    } catch {
      // silently keep stale data - user can reload
    }
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
      <div className="flex gap-4 mb-6 flex-wrap">
        <EmployeeForm managers={employees} onSuccess={refresh} />
        <CsvImport onSuccess={refresh} />
      </div>
      <table className="w-full bg-white border rounded-lg text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['ID','Name','Email','Department','Role','Manager',''].map(h => (
              <th key={h} className="text-left p-3 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-gray-400 text-xs">{emp.employeeId ?? '-'}</td>
              <td className="p-3 font-medium">{emp.name}</td>
              <td className="p-3 text-gray-500">{emp.email}</td>
              <td className="p-3">{emp.department ?? '-'}</td>
              <td className="p-3">{emp.role ?? '-'}</td>
              <td className="p-3">
                {editingManager === emp.id ? (
                  <div className="flex gap-1 items-center">
                    <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)}
                      className="border rounded p-1 text-xs">
                      <option value="">No manager</option>
                      {employees.filter(e => e.id !== emp.id).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <button onClick={() => saveManager(emp.id)} className="text-xs text-green-600 hover:text-green-800">Save</button>
                    <button onClick={() => setEditingManager(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                ) : (
                  <span>{emp.manager?.name ?? '-'}</span>
                )}
              </td>
              <td className="p-3">
                <button onClick={() => { setEditingManager(emp.id); setSelectedManager(emp.manager?.id ?? '') }}
                  className="text-xs text-blue-500 hover:text-blue-700">Edit manager</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {employees.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">No employees yet. Add one above.</p>
      )}
    </div>
  )
}
