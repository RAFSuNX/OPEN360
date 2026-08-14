import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { updateTemplateItem, deleteTemplateItem } from '@/lib/services/templates'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { itemId } = await params
  const data = await req.json()
  try {
    return NextResponse.json(await updateTemplateItem(orgId, itemId, data))
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { itemId } = await params
  try {
    await deleteTemplateItem(orgId, itemId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
