'use client'
import { useRef, useState } from 'react'

interface Props { onSuccess: () => void }

export function CsvImport({ onSuccess }: Props) {
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/employees/import', { method: 'POST', body: formData })
      const data = await res.json()
      setResult(data)
      if (data.imported > 0) onSuccess()
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white p-4 border rounded-lg">
      <h2 className="font-semibold text-sm mb-1">Bulk Import CSV</h2>
      <p className="text-xs text-gray-400 mb-3">Columns: name, email, manager_email, department, role</p>
      <input ref={inputRef} type="file" accept=".csv" onChange={handleUpload} disabled={loading} className="text-sm" />
      {loading && <p className="text-xs text-gray-500 mt-2">Importing...</p>}
      {result && (
        <div className="mt-2 text-xs">
          <p className="text-green-600">{result.imported} employees imported.</p>
          {result.errors.map((err, i) => <p key={i} className="text-red-500">{err}</p>)}
        </div>
      )}
    </div>
  )
}
