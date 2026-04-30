'use client'
import { useState } from 'react'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { CsvImport } from '@/components/admin/CsvImport'

interface Employee {
  id: string; name: string; email: string
  department: string | null; role: string | null
  manager: { id: string; name: string } | null
}

export function EmployeeTable({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees)

  async function refresh() {
    try {
      const res = await fetch('/api/admin/employees')
      if (res.ok) setEmployees(await res.json())
    } catch {
      // silently keep stale data - user can reload
    }
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
            {['Name','Email','Department','Role','Manager'].map(h => (
              <th key={h} className="text-left p-3 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">{emp.name}</td>
              <td className="p-3 text-gray-500">{emp.email}</td>
              <td className="p-3">{emp.department ?? '-'}</td>
              <td className="p-3">{emp.role ?? '-'}</td>
              <td className="p-3">{emp.manager?.name ?? '-'}</td>
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
