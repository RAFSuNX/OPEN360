'use client'
import { Relationship } from '@prisma/client'

interface QuestionResult {
  id: string; text: string; type: string; category: string
  average?: number; answers?: string[]
}

interface RelationshipResult {
  relationship: Relationship; visible: boolean; reason?: string; questions: QuestionResult[]
}

interface Props {
  results: Record<string, RelationshipResult>
  cycleTitle?: string
}

const REL_ORDER: Relationship[] = [Relationship.SELF, Relationship.MANAGER, Relationship.PEER, Relationship.DIRECT_REPORT]
const REL_LABELS: Record<Relationship, string> = {
  SELF: 'Self Review', MANAGER: 'Manager', PEER: 'Peers', DIRECT_REPORT: 'Direct Reports',
}

export default function MyResults({ results, cycleTitle }: Props) {
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {section.questions.map(q => (
                    <div key={q.id}>
                      <span className="badge" style={{ fontSize: '10px', marginBottom: '6px' }}>{q.category}</span>
                      <p style={{ fontSize: '14px', color: 'var(--body)', margin: '0 0 12px', lineHeight: '1.5' }}>{q.text}</p>

                      {q.type === 'RATING' && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{
                            fontSize: '40px', fontWeight: '400', color: 'var(--ink)',
                            letterSpacing: '-1px', fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {q.average !== undefined ? q.average : '-'}
                          </span>
                          <span style={{ fontSize: '16px', color: 'var(--muted)' }}>/5</span>
                        </div>
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
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
