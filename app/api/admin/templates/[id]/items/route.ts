import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { addTemplateItem } from '@/lib/services/templates'
import { QuestionType } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id: templateId } = await params
  const { text, selfText, type, ratingScale, category, applicableRole, sortOrder } = await req.json()
  if (!text || !type || !category || sortOrder == null) {
    return NextResponse.json({ error: 'text, type, category, and sortOrder are required' }, { status: 400 })
  }
  if (!['RATING', 'OPEN_TEXT'].includes(type)) {
    return NextResponse.json({ error: 'type must be RATING or OPEN_TEXT' }, { status: 400 })
  }
  try {
    const item = await addTemplateItem(orgId, templateId, { text, selfText, type: type as QuestionType, ratingScale, category, applicableRole, sortOrder })
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
