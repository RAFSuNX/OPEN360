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
    <div className="card" style={{ padding: '20px', minWidth: '260px' }}>
      <p className="section-label" style={{ marginBottom: '8px' }}>Bulk Import</p>
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px', lineHeight: '1.4' }}>
        CSV columns: name, email,<br />manager_email, department, role
      </p>
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'var(--surface-card)', color: 'var(--ink)',
        border: '1px solid var(--hairline-strong)', borderRadius: '8px',
        padding: '8px 14px', fontSize: '13px', fontWeight: '500',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {loading ? 'Importing...' : 'Upload CSV'}
        <input ref={inputRef} type="file" accept=".csv" onChange={handleUpload}
          disabled={loading} style={{ display: 'none' }} />
      </label>
      {result && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--semantic-success)' }}>{result.imported} imported</p>
          {result.errors.map((err, i) => (
            <p key={i} style={{ fontSize: '11px', color: 'var(--semantic-error)', marginTop: '2px' }}>{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}
