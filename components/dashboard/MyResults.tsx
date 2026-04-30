'use client'

import { Relationship } from '@prisma/client'

interface QuestionResult {
  id: string
  text: string
  type: string
  category: string
  average?: number
  answers?: string[]
}

interface RelationshipResult {
  relationship: Relationship
  visible: boolean
  reason?: string
  questions: QuestionResult[]
}

interface Props {
  results: Record<string, RelationshipResult>
}

const REL_ORDER: Relationship[] = [
  Relationship.SELF,
  Relationship.MANAGER,
  Relationship.PEER,
  Relationship.DIRECT_REPORT,
]

const REL_LABELS: Record<Relationship, string> = {
  SELF: 'Self Review',
  MANAGER: 'Manager',
  PEER: 'Peers',
  DIRECT_REPORT: 'Direct Reports',
}

export default function MyResults({ results }: Props) {
  return (
    <div className="space-y-8">
      {REL_ORDER.map(rel => {
        const section = results[rel]
        if (!section) return null

        return (
          <div key={rel} className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{REL_LABELS[rel]}</h2>

            {!section.visible ? (
              <p className="text-gray-500 italic text-sm">{section.reason}</p>
            ) : (
              <div className="space-y-6">
                {section.questions.map(q => (
                  <div key={q.id}>
                    <p className="font-medium text-gray-700 mb-2">{q.text}</p>

                    {q.type === 'RATING' && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-blue-600">
                          {q.average !== undefined ? q.average : '-'}
                        </span>
                        <span className="text-gray-400 text-lg">/5</span>
                      </div>
                    )}

                    {q.type === 'OPEN_TEXT' && (
                      <ul className="list-disc list-inside space-y-1">
                        {(q.answers ?? []).length === 0 ? (
                          <li className="text-gray-400 italic text-sm">No responses</li>
                        ) : (
                          (q.answers ?? []).map((ans, i) => (
                            <li key={i} className="text-gray-700 text-sm">{ans}</li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
