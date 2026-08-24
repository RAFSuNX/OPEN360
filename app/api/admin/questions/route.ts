import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { listQuestions, createQuestion, toggleQuestionActive, updateQuestion } from '@/lib/services/questions'
import { QuestionType } from '@prisma/client'

export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const questions = await listQuestions(orgId)
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const { text, selfText, type, category, applicableRole, ratingScale, sortOrder } = await req.json()
  if (!text || !type || !category) {
    return NextResponse.json({ error: 'text, type, and category are required' }, { status: 400 })
  }
  if (!Object.values(QuestionType).includes(type)) {
    return NextResponse.json({ error: 'type must be RATING or OPEN_TEXT' }, { status: 400 })
  }

  const question = await createQuestion(orgId, { text, selfText, type, category, applicableRole, ratingScale, sortOrder })
  return NextResponse.json(question, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const { id, isActive, text, selfText, type, category, applicableRole, ratingScale } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  if (text !== undefined || type !== undefined || category !== undefined || ratingScale !== undefined || selfText !== undefined || applicableRole !== undefined) {
    const question = await updateQuestion(orgId, id, {
      text: text ?? undefined,
      selfText: selfText ?? undefined,
      type: type ?? undefined,
      category: category ?? undefined,
      applicableRole: applicableRole ?? undefined,
      ratingScale: type === 'OPEN_TEXT' ? null : (ratingScale ?? undefined),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    })
    return NextResponse.json(question)
  }

  if (typeof isActive !== 'boolean') return NextResponse.json({ error: 'isActive required' }, { status: 400 })
  const question = await toggleQuestionActive(orgId, id, isActive)
  return NextResponse.json(question)
}
