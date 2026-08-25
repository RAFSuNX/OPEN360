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

export default function ExportPdfButton({ employeeName, cycleTitle, results }: Props) {
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = 210; const margin = 18; const usable = W - margin * 2
    let y = margin

    const addPage = () => { doc.addPage(); y = margin }
    const checkY = (needed: number) => { if (y + needed > 280) addPage() }

    // Header
    doc.setFontSize(9).setTextColor(150).text('OPEN360 — 360° Review Results', margin, y)
    y += 6
    doc.setFontSize(20).setTextColor(30).text(employeeName, margin, y)
    y += 8
    doc.setFontSize(10).setTextColor(100).text(cycleTitle, margin, y)
    y += 10
    doc.setDrawColor(230).line(margin, y, W - margin, y)
    y += 8

    for (const rel of ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']) {
      const section = results[rel]
      if (!section) continue

      checkY(14)
      doc.setFontSize(12).setTextColor(30).setFont('helvetica', 'bold')
      doc.text(REL_LABELS[rel] ?? rel, margin, y)
      y += 6

      if (!section.visible) {
        doc.setFontSize(9).setTextColor(130).setFont('helvetica', 'normal')
        doc.text(section.reason ?? 'Not enough responses', margin + 2, y)
        y += 8; continue
      }

      let lastCat = ''
      for (const q of section.questions) {
        if (q.category !== lastCat) {
          checkY(10)
          doc.setFontSize(8).setTextColor(150).setFont('helvetica', 'bold')
          doc.text(q.category.toUpperCase(), margin + 2, y)
          y += 5; lastCat = q.category
        }

        const qText = q.text.replace(/\[Name\]/g, employeeName)
        const lines = doc.splitTextToSize(qText, usable - 4) as string[]
        const blockH = lines.length * 4.5 + (q.type === 'RATING' ? 8 : (q.answers ?? []).reduce((a, ans) => a + doc.splitTextToSize(ans, usable - 10).length * 4, 0) + 4)
        checkY(blockH)

        doc.setFontSize(9).setTextColor(40).setFont('helvetica', 'normal')
        doc.text(lines, margin + 2, y); y += lines.length * 4.5

        if (q.type === 'RATING' && q.average !== undefined) {
          doc.setFontSize(11).setTextColor(245, 78, 0).setFont('helvetica', 'bold')
          doc.text(`${q.average.toFixed(1)} / 5`, margin + 2, y)
          y += 8
        } else if (q.answers) {
          doc.setFontSize(8).setTextColor(80).setFont('helvetica', 'normal')
          for (const ans of q.answers) {
            const aLines = doc.splitTextToSize(`• ${ans}`, usable - 10) as string[]
            checkY(aLines.length * 4 + 2)
            doc.text(aLines, margin + 6, y); y += aLines.length * 4 + 1
          }
          y += 3
        }
      }
      y += 4
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
