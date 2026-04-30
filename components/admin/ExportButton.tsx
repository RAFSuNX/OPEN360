'use client'
import { useState } from 'react'

interface ExportButtonProps {
  cycleId: string
  employeeId: string
  employeeName?: string
  cycleTitle?: string
}

const REL_LABELS: Record<string, string> = {
  SELF: 'Self Review',
  MANAGER: 'Manager',
  PEER: 'Peers',
  DIRECT_REPORT: 'Direct Reports',
}

export function ExportButton({ cycleId, employeeId, employeeName = 'Employee', cycleTitle = 'Review' }: ExportButtonProps) {
  const [loadingCsv, setLoadingCsv] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  async function handleCsvExport() {
    setLoadingCsv(true)
    try {
      const res = await fetch(`/api/admin/results/${cycleId}/${employeeId}/export`)
      if (!res.ok) { alert('Export failed'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${employeeName}-${cycleTitle}.csv`.replace(/\s+/g, '-')
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingCsv(false) }
  }

  async function handlePdfExport() {
    setLoadingPdf(true)
    try {
      // Fetch results data
      const res = await fetch(`/api/admin/results/${cycleId}/${employeeId}`)
      if (!res.ok) { alert('Export failed'); return }
      const results: Record<string, { relationship: string; visible: boolean; reason?: string; questions: { text: string; type: string; category: string; average?: number; answers?: string[] }[] }> = await res.json()

      // Dynamic import jspdf to avoid SSR issues
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 18
      const contentW = pageW - margin * 2
      let y = margin

      function checkPage(needed = 10) {
        if (y + needed > pageH - margin) { doc.addPage(); y = margin }
      }

      // Header
      doc.setFillColor(245, 78, 0) // primary orange
      doc.rect(0, 0, pageW, 14, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('OPEN360 — 360-Degree Review Results', margin, 9.5)
      y = 22

      doc.setTextColor(38, 37, 30)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(employeeName, margin, y)
      y += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(90, 88, 82)
      doc.text(cycleTitle, margin, y)
      y += 6
      doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y)
      y += 10

      // Hairline
      doc.setDrawColor(230, 229, 224)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      const relOrder = ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']
      for (const rel of relOrder) {
        const section = results[rel]
        if (!section) continue

        checkPage(20)

        // Section header
        doc.setFillColor(247, 247, 244)
        doc.rect(margin, y - 4, contentW, 10, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(128, 125, 114)
        doc.text((REL_LABELS[rel] ?? rel).toUpperCase(), margin + 3, y + 2.5)
        y += 10

        if (!section.visible) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(160, 156, 146)
          doc.text(section.reason ?? 'Not enough responses', margin + 3, y)
          y += 10
          continue
        }

        for (const q of section.questions) {
          checkPage(16)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(38, 37, 30)
          const lines = doc.splitTextToSize(q.text, contentW - 6) as string[]
          doc.text(lines, margin + 3, y)
          y += lines.length * 5 + 2

          if (q.type === 'RATING' && q.average !== undefined) {
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(245, 78, 0)
            doc.text(String(q.average), margin + 3, y + 6)
            doc.setFontSize(11)
            doc.setTextColor(128, 125, 114)
            doc.text('/ 5', margin + 18, y + 6)
            y += 14
          }

          if (q.type === 'OPEN_TEXT' && q.answers?.length) {
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(90, 88, 82)
            for (const ans of q.answers) {
              checkPage(8)
              const ansLines = doc.splitTextToSize(`• ${ans}`, contentW - 10) as string[]
              doc.text(ansLines, margin + 6, y)
              y += ansLines.length * 5 + 2
            }
          }

          y += 4
          doc.setDrawColor(239, 238, 232)
          doc.line(margin + 3, y, pageW - margin - 3, y)
          y += 6
        }
        y += 4
      }

      // Footer on each page
      const totalPages = doc.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(8)
        doc.setTextColor(160, 156, 146)
        doc.setFont('helvetica', 'normal')
        doc.text(`OPEN360 · Confidential · Page ${p} of ${totalPages}`, margin, pageH - 8)
        doc.text(new Date().toLocaleDateString(), pageW - margin, pageH - 8, { align: 'right' })
      }

      doc.save(`${employeeName}-${cycleTitle}.pdf`.replace(/\s+/g, '-'))
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={handleCsvExport} disabled={loadingCsv} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}>
        {loadingCsv ? 'Exporting...' : 'Export CSV'}
      </button>
      <button onClick={handlePdfExport} disabled={loadingPdf} className="btn-primary" style={{ fontSize: '12px', padding: '7px 12px' }}>
        {loadingPdf ? 'Generating...' : 'Export PDF'}
      </button>
    </div>
  )
}
