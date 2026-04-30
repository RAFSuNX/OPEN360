import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listQuestions, createQuestion, toggleQuestionActive, updateQuestion } from '@/lib/services/questions'
import { QuestionType } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const questions = await listQuestions()
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, type, category, ratingScale, sortOrder } = await req.json()
  if (!text || !type || !category) {
    return NextResponse.json({ error: 'text, type, and category are required' }, { status: 400 })
  }
  if (!Object.values(QuestionType).includes(type)) {
    return NextResponse.json({ error: 'type must be RATING or OPEN_TEXT' }, { status: 400 })
  }

  const question = await createQuestion({ text, type, category, ratingScale, sortOrder })
  return NextResponse.json(question, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, isActive, text, type, category, ratingScale } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Full edit
  if (text !== undefined || type !== undefined || category !== undefined || ratingScale !== undefined) {
    const question = await updateQuestion(id, {
      text: text ?? undefined,
      type: type ?? undefined,
      category: category ?? undefined,
      ratingScale: type === 'OPEN_TEXT' ? null : (ratingScale ?? undefined),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    })
    return NextResponse.json(question)
  }

  // Toggle only
  if (typeof isActive !== 'boolean') return NextResponse.json({ error: 'isActive required' }, { status: 400 })
  const question = await toggleQuestionActive(id, isActive)
  return NextResponse.json(question)
}
