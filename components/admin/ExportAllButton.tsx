'use client'
import { useState } from 'react'

const REL_LABELS: Record<string, string> = {
  SELF: 'Self Assessment', MANAGER: 'Manager', PEER: 'Peers', DIRECT_REPORT: 'Direct Reports',
}
const REL_ORDER = ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']

async function generatePdf(doc: import('jspdf').jsPDF, employeeName: string, cycleTitle: string, results: Record<string, unknown>) {
  const W = 210; const ml = 20; const mr = 20; const usable = W - ml - mr
  let y = 0
  const addPage = () => {
    doc.addPage(); y = 20
    doc.setFontSize(7).setTextColor(180).setFont('helvetica', 'normal')
    doc.text('OPEN360  ·  360° Review Results  ·  CONFIDENTIAL', ml, 12)
    doc.setDrawColor(220).line(ml, 14, W - mr, 14)
    y = 22
  }
  const checkY = (n: number) => { if (y + n > 272) addPage() }

  doc.setFillColor(28, 18, 8); doc.rect(0, 0, W, 28, 'F')
  doc.setFontSize(14).setTextColor(255,255,255).setFont('helvetica','bold')
  doc.text('OPEN', ml, 13)
  doc.setTextColor(245,78,0); doc.text('360', ml + doc.getTextWidth('OPEN'), 13)
  doc.setFontSize(7.5).setTextColor(160,156,146).setFont('helvetica','normal')
  doc.text('360° Performance Review', ml, 21)
  doc.setFontSize(7).setTextColor(100,96,88)
  doc.text('CONFIDENTIAL', W - mr - doc.getTextWidth('CONFIDENTIAL'), 13)

  y = 44
  doc.setFontSize(26).setTextColor(26,25,23).setFont('helvetica','bold'); doc.text(employeeName, ml, y); y += 9
  doc.setFontSize(11).setTextColor(90,88,82).setFont('helvetica','normal'); doc.text(cycleTitle, ml, y); y += 6
  const now = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', timeZone:'Asia/Dhaka' })
  doc.setFontSize(8.5).setTextColor(140); doc.text(`Generated ${now}  ·  GMT+6`, ml, y); y += 10
  doc.setDrawColor(220).setLineWidth(0.4).line(ml, y, W - mr, y); y += 14

  for (const rel of REL_ORDER) {
    const section = results[rel] as { visible: boolean; reason?: string; questions: { id: string; text: string; type: string; category: string; average?: number; answers?: string[] }[] } | undefined
    if (!section) continue
    if (!section.visible && section.reason === 'No responses yet.') continue
    checkY(18)
    doc.setFillColor(245,78,0)
    doc.roundedRect(ml, y - 5, doc.getTextWidth(REL_LABELS[rel]) + 8, 7, 1.5, 1.5, 'F')
    doc.setFontSize(9).setTextColor(255,255,255).setFont('helvetica','bold')
    doc.text(REL_LABELS[rel], ml + 4, y); y += 8
    if (!section.visible) {
      doc.setFontSize(8.5).setTextColor(150).setFont('helvetica','normal')
      doc.text(section.reason ?? 'Not enough responses', ml + 2, y); y += 10; continue
    }
    let lastCat = ''
    for (const q of section.questions) {
      if (q.category !== lastCat) {
        checkY(12); y += 2
        doc.setFontSize(7).setTextColor(160).setFont('helvetica','bold')
        doc.text(q.category.toUpperCase(), ml + 2, y); y += 5; lastCat = q.category
      }
      const qText = q.text.replace(/\[Name\]/g, employeeName)
      const lines = doc.splitTextToSize(qText, usable - 4) as string[]
      const ansH = q.type === 'OPEN_TEXT' ? (q.answers ?? []).reduce((a: number, ans: string) => a + (doc.splitTextToSize(ans, usable - 14) as string[]).length * 4.2 + 2, 0) + 4 : 10
      checkY(lines.length * 4.8 + ansH + 6)
      doc.setFontSize(9).setTextColor(40).setFont('helvetica','normal')
      doc.text(lines, ml + 2, y); y += lines.length * 4.8
      if (q.type === 'RATING' && q.average !== undefined) {
        const barW = usable - 4
        doc.setFontSize(13).setTextColor(245,78,0).setFont('helvetica','bold')
        doc.text(`${q.average.toFixed(1)}`, ml + 2, y + 3)
        doc.setFontSize(8).setTextColor(130).setFont('helvetica','normal')
        doc.text(`/ 5`, ml + 2 + doc.getTextWidth(`${q.average.toFixed(1)}`) + 1, y + 3)
        doc.setFillColor(235,233,228); doc.roundedRect(ml + 22, y - 1, barW - 22, 4, 2, 2, 'F')
        doc.setFillColor(245,78,0); doc.roundedRect(ml + 22, y - 1, Math.max(4, ((q.average / 5) * (barW - 22))), 4, 2, 2, 'F')
        y += 10
      } else if (q.answers && q.answers.length > 0) {
        for (const ans of q.answers) {
          const aLines = doc.splitTextToSize(ans, usable - 14) as string[]
          checkY(aLines.length * 4.2 + 4)
          doc.setFillColor(245,78,0); doc.rect(ml + 2, y - 2.5, 1.5, aLines.length * 4.2 + 1, 'F')
          doc.setFontSize(8.5).setTextColor(70).setFont('helvetica','normal')
          doc.text(aLines, ml + 6, y); y += aLines.length * 4.2 + 4
        }
      }
      y += 2
    }
    y += 4
    if (y < 270) { doc.setDrawColor(235).setLineWidth(0.3).line(ml, y, W - mr, y); y += 8 }
  }
}

export default function ExportAllButton({ cycleId }: { cycleId: string }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  async function generateAll() {
    setLoading(true)
    try {
      setProgress('Fetching results…')
      const res = await fetch(`/api/admin/results/${cycleId}/export-all`)
      if (!res.ok) { setProgress(''); return }
      const data = await res.json() as { cycleTitle: string; employees: { id: string; name: string; results: Record<string, unknown> }[] }

      const { jsPDF } = await import('jspdf')

      for (let i = 0; i < data.employees.length; i++) {
        const emp = data.employees[i]
        setProgress(`Generating ${i + 1}/${data.employees.length}: ${emp.name}…`)
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        await generatePdf(doc, emp.name, data.cycleTitle, emp.results)
        doc.save(`${emp.name.replace(/\s+/g, '_')}_${data.cycleTitle.replace(/\s+/g, '_')}.pdf`)
        await new Promise(r => setTimeout(r, 300)) // small gap between downloads
      }
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <button
      onClick={generateAll}
      disabled={loading}
      style={{
        fontSize: '13px', fontWeight: '500', color: 'var(--ink)',
        background: 'none', cursor: loading ? 'wait' : 'pointer',
        padding: '7px 16px', borderRadius: '8px',
        border: '1px solid var(--hairline)', fontFamily: 'inherit',
      }}
    >
      {loading ? (progress || 'Generating…') : 'Export All PDFs'}
    </button>
  )
}
