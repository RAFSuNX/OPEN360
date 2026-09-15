'use client'
import { useState } from 'react'

interface QuestionResult {
  id: string; text: string; type: string; category: string
  average?: number; answers?: string[]
}
interface RelationshipResult {
  relationship: string; visible: boolean; reason?: string; questions: QuestionResult[]
}
interface Props {
  employeeName: string
  cycleTitle: string
  results: Record<string, RelationshipResult>
}

const REL_LABELS: Record<string, string> = {
  SELF: 'Self Assessment', MANAGER: 'Manager', PEER: 'Peers', DIRECT_REPORT: 'Direct Reports',
}
const REL_ORDER = ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']

export default function ExportPdfButton({ employeeName, cycleTitle, results }: Props) {
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = 210
    const ml = 20   // left margin
    const mr = 20   // right margin
    const usable = W - ml - mr
    let y = 0

    const addPage = () => {
      doc.addPage()
      y = 20
      // Subtle page header
      doc.setFontSize(7).setTextColor(180).setFont('helvetica', 'normal')
      doc.text('OPEN360  ·  360° Review Results  ·  CONFIDENTIAL', ml, 12)
      doc.setDrawColor(220).line(ml, 14, W - mr, 14)
      y = 22
    }

    const checkY = (needed: number) => { if (y + needed > 272) addPage() }

    // ── Cover header block ────────────────────────────────────────────────────
    // Dark brand bar across top
    doc.setFillColor(28, 18, 8)  // #1c1208
    doc.rect(0, 0, W, 28, 'F')

    // OPEN360 wordmark
    doc.setFontSize(14).setTextColor(255, 255, 255).setFont('helvetica', 'bold')
    doc.text('OPEN', ml, 13)
    // "360" in orange
    const open360Width = doc.getTextWidth('OPEN')
    doc.setTextColor(245, 78, 0)
    doc.text('360', ml + open360Width, 13)

    // Tagline
    doc.setFontSize(7.5).setTextColor(160, 156, 146).setFont('helvetica', 'normal')
    doc.text('360° Performance Review', ml, 21)

    // Confidential badge top-right
    doc.setFontSize(7).setTextColor(100, 96, 88)
    doc.text('CONFIDENTIAL', W - mr - doc.getTextWidth('CONFIDENTIAL'), 13)

    y = 44

    // Employee name — large
    doc.setFontSize(26).setTextColor(26, 25, 23).setFont('helvetica', 'bold')
    doc.text(employeeName, ml, y)
    y += 9

    // Cycle title
    doc.setFontSize(11).setTextColor(90, 88, 82).setFont('helvetica', 'normal')
    doc.text(cycleTitle, ml, y)
    y += 6

    // Generated date (GMT+6)
    const now = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka',
    })
    doc.setFontSize(8.5).setTextColor(140)
    doc.text(`Generated ${now}  ·  GMT+6`, ml, y)
    y += 10

    // Full-width divider
    doc.setDrawColor(220).setLineWidth(0.4).line(ml, y, W - mr, y)
    y += 14

    // ── Result sections ───────────────────────────────────────────────────────
    for (const rel of REL_ORDER) {
      const section = results[rel]
      if (!section) continue
      if (!section.visible && section.reason === 'No responses yet.') continue

      checkY(18)

      // Relationship heading pill background
      doc.setFillColor(245, 78, 0)
      doc.roundedRect(ml, y - 5, doc.getTextWidth(REL_LABELS[rel] ?? rel) + 8, 7, 1.5, 1.5, 'F')
      doc.setFontSize(9).setTextColor(255, 255, 255).setFont('helvetica', 'bold')
      doc.text(REL_LABELS[rel] ?? rel, ml + 4, y)
      y += 8

      if (!section.visible) {
        doc.setFontSize(8.5).setTextColor(150).setFont('helvetica', 'normal')
        doc.text(section.reason ?? 'Not enough responses', ml + 2, y)
        y += 10; continue
      }

      let lastCat = ''
      for (const q of section.questions) {
        // Category label
        if (q.category !== lastCat) {
          checkY(12)
          y += 2
          doc.setFontSize(7).setTextColor(160).setFont('helvetica', 'bold')
          doc.text(q.category.toUpperCase(), ml + 2, y)
          y += 5; lastCat = q.category
        }

        const qText = q.text.replace(/\[Name\]/g, employeeName)
        const lines = doc.splitTextToSize(qText, usable - 4) as string[]
        const ansH = q.type === 'OPEN_TEXT'
          ? (q.answers ?? []).reduce((a, ans) => a + (doc.splitTextToSize(ans, usable - 14) as string[]).length * 4.2 + 2, 0) + 4
          : 10
        checkY(lines.length * 4.8 + ansH + 6)

        // Question text
        doc.setFontSize(9).setTextColor(40).setFont('helvetica', 'normal')
        doc.text(lines, ml + 2, y); y += lines.length * 4.8

        if (q.type === 'RATING' && q.average !== undefined) {
          const score = q.average
          const max = 5
          const barW = usable - 4
          const filled = (score / max) * barW

          // Score number
          doc.setFontSize(13).setTextColor(245, 78, 0).setFont('helvetica', 'bold')
          doc.text(`${score.toFixed(1)}`, ml + 2, y + 3)

          // /5 label
          doc.setFontSize(8).setTextColor(130).setFont('helvetica', 'normal')
          doc.text(`/ ${max}`, ml + 2 + doc.getTextWidth(`${score.toFixed(1)}`) + 1, y + 3)

          // Progress bar track
          doc.setFillColor(235, 233, 228)
          doc.roundedRect(ml + 22, y - 1, barW - 22, 4, 2, 2, 'F')

          // Progress bar fill
          doc.setFillColor(245, 78, 0)
          doc.roundedRect(ml + 22, y - 1, Math.max(4, (filled * (barW - 22)) / barW), 4, 2, 2, 'F')

          y += 10

        } else if (q.answers && q.answers.length > 0) {
          for (const ans of q.answers) {
            const aLines = doc.splitTextToSize(ans, usable - 14) as string[]
            checkY(aLines.length * 4.2 + 4)
            // Quote bar
            doc.setFillColor(245, 78, 0)
            doc.rect(ml + 2, y - 2.5, 1.5, aLines.length * 4.2 + 1, 'F')
            doc.setFontSize(8.5).setTextColor(70).setFont('helvetica', 'normal')
            doc.text(aLines, ml + 6, y)
            y += aLines.length * 4.2 + 4
          }
        }
        y += 2
      }

      // Section separator
      y += 4
      if (y < 270) {
        doc.setDrawColor(235).setLineWidth(0.3).line(ml, y, W - mr, y)
        y += 8
      }
    }

    doc.save(`${employeeName.replace(/\s+/g, '_')}_${cycleTitle.replace(/\s+/g, '_')}.pdf`)
    setLoading(false)
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      style={{
        fontSize: '13px', fontWeight: '500', color: 'var(--ink)',
        background: 'none', cursor: loading ? 'wait' : 'pointer',
        padding: '7px 16px', borderRadius: '8px',
        border: '1px solid var(--hairline)', fontFamily: 'inherit',
      }}
    >
      {loading ? 'Generating…' : 'Export PDF'}
    </button>
  )
}
