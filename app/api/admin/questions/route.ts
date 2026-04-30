import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listQuestions, createQuestion, toggleQuestionActive } from '@/lib/services/questions'
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

  const { id, isActive } = await req.json()
  if (!id || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'id and isActive are required' }, { status: 400 })
  }

  const question = await toggleQuestionActive(id, isActive)
  return NextResponse.json(question)
}
