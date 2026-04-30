import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addTemplateItem } from '@/lib/services/templates'
import { QuestionType } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: templateId } = await params
  const { text, type, ratingScale, category, sortOrder } = await req.json()
  if (!text || !type || !category || sortOrder == null) {
    return NextResponse.json({ error: 'text, type, category, and sortOrder are required' }, { status: 400 })
  }
  if (!['RATING', 'OPEN_TEXT'].includes(type)) {
    return NextResponse.json({ error: 'type must be RATING or OPEN_TEXT' }, { status: 400 })
  }
  try {
    const item = await addTemplateItem(templateId, { text, type: type as QuestionType, ratingScale, category, sortOrder })
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
