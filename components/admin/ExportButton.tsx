'use client'
import { useState } from 'react'

interface ExportButtonProps {
  cycleId: string
  employeeId: string
  employeeName?: string
  cycleTitle?: string
  employeeEmail?: string
  employeeIdCode?: string
  employeeRole?: string
  employeeDepartment?: string
  orgName?: string
  orgLogoApiUrl?: string
}

const REL_LABELS: Record<string, string> = {
  SELF: 'Self Review',
  MANAGER: 'Manager',
  PEER: 'Peers',
  DIRECT_REPORT: 'Direct Reports',
}

export function ExportButton({ cycleId, employeeId, employeeName = 'Employee', cycleTitle = 'Review', employeeEmail, employeeIdCode, employeeRole, employeeDepartment, orgName, orgLogoApiUrl }: ExportButtonProps) {
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

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = doc.internal.pageSize.getWidth()   // 210
      const H = doc.internal.pageSize.getHeight()  // 297
      const ML = 20   // left margin
      const MR = 20   // right margin
      const CW = W - ML - MR
      const FOOTER_H = 14
      let y = 0

      // Colors
      const INK    = [38, 37, 30]   as [number,number,number]
      const BODY   = [90, 88, 82]   as [number,number,number]
      const MUTED  = [128, 125, 114] as [number,number,number]
      const HAIR   = [230, 229, 224] as [number,number,number]
      const CANVAS = [247, 247, 244] as [number,number,number]
      const ORANGE = [245, 78, 0]   as [number,number,number]
      const WHITE  = [255, 255, 255] as [number,number,number]

      function addPageHeader() {
        // Thin orange top strip
        doc.setFillColor(...ORANGE)
        doc.rect(0, 0, W, 5, 'F')
        // Warm canvas bg strip
        doc.setFillColor(...CANVAS)
        doc.rect(0, 5, W, 14, 'F')
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...MUTED)
        doc.text(`${orgName ? orgName.toUpperCase() + '  ' : ''}OPEN360  360-DEGREE REVIEW`, ML, 14)
        doc.setFont('helvetica', 'normal')
        doc.text(employeeName.toUpperCase(), W - MR, 14, { align: 'right' })
        // hairline below header
        doc.setDrawColor(...HAIR)
        doc.line(ML, 19, W - MR, 19)
        y = 26
      }

      function addPageFooter(page: number, total: number) {
        doc.setDrawColor(...HAIR)
        doc.line(ML, H - FOOTER_H + 2, W - MR, H - FOOTER_H + 2)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        doc.text(`${orgName || 'OPEN360'} - Confidential - For internal HR use only`, ML, H - 7)
        doc.text(`Page ${page} of ${total}`, W - MR, H - 7, { align: 'right' })
      }

      function checkPage(needed = 12) {
        if (y + needed > H - FOOTER_H - 4) {
          doc.addPage()
          addPageHeader()
        }
      }

      // ─── COVER PAGE ────────────────────────────────────────────────────────
      // Large orange block top half
      doc.setFillColor(...ORANGE)
      doc.rect(0, 0, W, H * 0.42, 'F')

      // Org logo + name in top-left of cover
      if (orgLogoApiUrl) {
        try {
          const logoRes = await fetch(orgLogoApiUrl)
          if (logoRes.ok) {
            const logoBlob = await logoRes.blob()
            const logoDataUrl = await new Promise<string>(resolve => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(logoBlob)
            })
            doc.addImage(logoDataUrl, 'JPEG', ML, 10, 30, 10, undefined, 'FAST')
          }
        } catch { /* skip logo if fetch fails */ }
      }

      // Org name
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      const orgLabel = orgName || 'OPEN360'
      doc.text(orgLogoApiUrl ? '' : orgLabel, ML, 18)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 170)
      doc.setFontSize(8)
      if (orgName) doc.text('Powered by OPEN360', W - MR, 15, { align: 'right' })

      // Big name
      doc.setFontSize(32)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      const nameLines = doc.splitTextToSize(employeeName, CW) as string[]
      doc.text(nameLines, ML, 60)

      // Subtitle
      doc.setFontSize(13)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 170)
      doc.text('360-Degree Performance Review', ML, 60 + nameLines.length * 14 + 4)

      // Employee details below name
      const detailY = 60 + nameLines.length * 14 + 18
      const details = [
        employeeIdCode ? `ID: ${employeeIdCode}` : null,
        employeeRole ?? null,
        employeeDepartment ?? null,
        employeeEmail ?? null,
      ].filter(Boolean) as string[]

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 200, 170)
      doc.text(details.join('  |  '), ML, detailY)

      // Cycle pill
      const pillY = H * 0.42 - 18
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...WHITE)
      doc.text(cycleTitle, ML, pillY)

      // Lower half meta cards
      const cardTop = H * 0.42 + 10
      const cardH = 22

      const metaItems = [
        { label: 'GENERATED', value: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
        { label: 'CLASSIFICATION', value: 'Confidential' },
        { label: 'RESPONDENT GROUPS', value: ['Self', 'Manager', 'Peers', 'Direct Reports'].filter(r => results[r.replace(' ', '_').toUpperCase()]?.visible).join(', ') || 'See report' },
      ]

      metaItems.forEach((item, i) => {
        const cx = ML + i * (CW / 3 + 2)
        doc.setFillColor(...CANVAS)
        doc.roundedRect(cx, cardTop, CW / 3 - 2, cardH, 2, 2, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...MUTED)
        doc.text(item.label, cx + 5, cardTop + 7)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...INK)
        const vLines = doc.splitTextToSize(item.value, CW / 3 - 12) as string[]
        doc.text(vLines, cx + 5, cardTop + 14)
      })

      // Summary ratings strip
      const ratingQs = Object.values(results).flatMap(s =>
        s.visible ? s.questions.filter(q => q.type === 'RATING' && q.average !== undefined) : []
      )
      if (ratingQs.length > 0) {
        const stripY = cardTop + cardH + 14
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...INK)
        doc.text('OVERALL SCORES AT A GLANCE', ML, stripY)
        doc.setDrawColor(...HAIR)
        doc.line(ML, stripY + 3, W - MR, stripY + 3)

        let sx = ML
        const itemW = CW / Math.min(ratingQs.length, 4)
        ratingQs.slice(0, 4).forEach(q => {
          const scoreY = stripY + 18
          // Score
          doc.setFontSize(26)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...ORANGE)
          doc.text(String(q.average), sx, scoreY)
          doc.setFontSize(10)
          doc.setTextColor(...MUTED)
          doc.text('/5', sx + 14, scoreY)
          // Category
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...MUTED)
          const catLines = doc.splitTextToSize(q.category, itemW - 4) as string[]
          doc.text(catLines, sx, scoreY + 5)
          // Rating bar
          const barY = scoreY + 10
          const barW = itemW - 8
          doc.setFillColor(...HAIR)
          doc.roundedRect(sx, barY, barW, 2.5, 1, 1, 'F')
          doc.setFillColor(...ORANGE)
          doc.roundedRect(sx, barY, barW * ((q.average ?? 0) / 5), 2.5, 1, 1, 'F')
          sx += itemW
        })
      }

      // ─── CONTENT PAGES ─────────────────────────────────────────────────────
      const relOrder = ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']

      for (const rel of relOrder) {
        const section = results[rel]
        if (!section) continue

        doc.addPage()
        addPageHeader()

        // Section title band
        doc.setFillColor(...INK)
        doc.rect(ML, y - 4, CW, 12, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...WHITE)
        doc.text((REL_LABELS[rel] ?? rel).toUpperCase(), ML + 5, y + 4)
        y += 14

        if (!section.visible) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...MUTED)
          doc.text(section.reason ?? 'Insufficient responses for anonymous display', ML, y + 6)
          continue
        }

        for (const q of section.questions) {
          checkPage(q.type === 'RATING' ? 30 : 24)

          // Question card background
          const startY = y
          // Question text
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...INK)
          const qLines = doc.splitTextToSize(q.text, CW - 4) as string[]
          doc.text(qLines, ML, y)
          y += qLines.length * 5.5

          // Category badge
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...MUTED)
          const badgeW = doc.getTextWidth(q.category) + 6
          doc.setFillColor(...CANVAS)
          doc.roundedRect(ML, y + 1, badgeW, 5, 1, 1, 'F')
          doc.setTextColor(...MUTED)
          doc.text(q.category, ML + 3, y + 4.5)
          y += 9

          if (q.type === 'RATING' && q.average !== undefined) {
            checkPage(20)
            // Score + bar
            doc.setFontSize(28)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...ORANGE)
            doc.text(String(q.average), ML, y + 8)
            doc.setFontSize(12)
            doc.setTextColor(...MUTED)
            doc.text('out of 5', ML + 18, y + 8)

            // Visual bar
            const barX = ML + 45
            const barW = CW - 45
            const barH2 = 5
            const barY2 = y + 3
            doc.setFillColor(...HAIR)
            doc.roundedRect(barX, barY2, barW, barH2, 2, 2, 'F')
            doc.setFillColor(...ORANGE)
            doc.roundedRect(barX, barY2, barW * ((q.average) / 5), barH2, 2, 2, 'F')
            // Tick marks at 1-5
            for (let t = 1; t <= 5; t++) {
              const tx = barX + barW * (t / 5)
              doc.setDrawColor(...WHITE)
              doc.setLineWidth(0.4)
              doc.line(tx, barY2, tx, barY2 + barH2)
            }
            doc.setLineWidth(0.2)
            y += 16
          }

          if (q.type === 'OPEN_TEXT') {
            const answers = q.answers ?? []
            if (answers.length === 0) {
              doc.setFontSize(9)
              doc.setFont('helvetica', 'italic')
              doc.setTextColor(...MUTED)
              doc.text('No responses submitted', ML, y)
              y += 8
            } else {
              for (const ans of answers) {
                checkPage(14)
                // Quote block
                doc.setFillColor(...CANVAS)
                const ansLines = doc.splitTextToSize(ans, CW - 12) as string[]
                const blockH = ansLines.length * 5 + 8
                doc.roundedRect(ML, y, CW, blockH, 2, 2, 'F')
                // Orange left accent
                doc.setFillColor(...ORANGE)
                doc.roundedRect(ML, y, 2.5, blockH, 1, 1, 'F')
                doc.setFontSize(9.5)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...BODY)
                doc.text(ansLines, ML + 7, y + 6)
                y += blockH + 4
              }
            }
          }

          // Divider
          y += 4
          doc.setDrawColor(...HAIR)
          doc.setLineWidth(0.3)
          doc.line(ML, y, W - MR, y)
          y += 7
        }
      }

      // Add footers to all pages (skip cover)
      const totalPages = doc.getNumberOfPages()
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p)
        addPageFooter(p - 1, totalPages - 1)
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
