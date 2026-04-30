'use client'
import { useState } from 'react'

interface ExportButtonProps {
  cycleId: string
  employeeId: string
}

export function ExportButton({ cycleId, employeeId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/results/${cycleId}/${employeeId}/export`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `results-${cycleId}-${employeeId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-secondary"
      style={{ fontSize: '13px' }}
    >
      {loading ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
