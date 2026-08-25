'use client'
import { Relationship } from '@prisma/client'

interface QuestionResult {
  id: string; text: string; type: string; category: string
  average?: number; ratingScale?: number | null; answers?: string[]
}

interface RelationshipResult {
  relationship: Relationship; visible: boolean; reason?: string; questions: QuestionResult[]
}

interface Props {
  results: Record<string, RelationshipResult>
  cycleTitle?: string
  employeeName?: string
}

const REL_ORDER: Relationship[] = [Relationship.SELF, Relationship.MANAGER, Relationship.PEER, Relationship.DIRECT_REPORT]
const REL_LABELS: Record<Relationship, string> = {
  SELF: 'Self Review', MANAGER: 'Manager', PEER: 'Peers', DIRECT_REPORT: 'Direct Reports',
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 80 ? 'var(--semantic-success)' : pct >= 60 ? 'var(--primary)' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', minWidth: '64px' }}>
        <span style={{
          fontSize: '36px', fontWeight: '400', color: 'var(--ink)',
          letterSpacing: '-1px', fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1,
        }}>
          {value}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>/{max}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          height: '6px', background: 'var(--hairline)', borderRadius: '9999px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`, background: color,
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 0', letterSpacing: '0.5px' }}>
          {pct}%
        </p>
      </div>
    </div>
  )
}

export default function MyResults({ results, cycleTitle, employeeName }: Props) {
  const resolveName = (text: string) =>
    employeeName ? text.replace(/\[Name\]/g, employeeName) : text
  return (
    <div>
      {cycleTitle && (
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label" style={{ marginBottom: '8px' }}>Results</p>
          <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
            {cycleTitle}
          </h1>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {REL_ORDER.map(rel => {
          const section = results[rel]
          if (!section) return null

          return (
            <div key={rel} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--hairline-soft)' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>{REL_LABELS[rel]}</p>
                {!section.visible && (
                  <span className="badge" style={{ fontSize: '10px' }}>Insufficient responses</span>
                )}
              </div>

              {!section.visible ? (
                <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>{section.reason}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {section.questions.map(q => {
                    const scale = q.ratingScale ?? 5
                    return (
                      <div key={q.id}>
                        <span className="badge" style={{ fontSize: '10px', marginBottom: '6px' }}>{q.category}</span>
                        <p style={{ fontSize: '14px', color: 'var(--body)', margin: '0 0 12px', lineHeight: '1.5' }}>{resolveName(q.text)}</p>

                        {q.type === 'RATING' && (
                          q.average !== undefined
                            ? <RatingBar value={q.average} max={scale} />
                            : <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>No responses yet</p>
                        )}

                        {q.type === 'OPEN_TEXT' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(q.answers ?? []).length === 0 ? (
                              <p style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>No responses</p>
                            ) : (
                              (q.answers ?? []).map((ans, i) => (
                                <div key={i} style={{
                                  background: 'var(--canvas-soft)',
                                  borderLeft: '2px solid var(--hairline-strong)',
                                  padding: '10px 14px',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: '14px', color: 'var(--body)', lineHeight: '1.5',
                                }}>{ans}</div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
