import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { getTemplate, updateTemplate, deleteTemplate } from '@/lib/services/templates'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id } = await params
  const t = await getTemplate(orgId, id)
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(t)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id } = await params
  const { name, description } = await req.json()
  try {
    return NextResponse.json(await updateTemplate(orgId, id, { name, description }))
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id } = await params
  try {
    await deleteTemplate(orgId, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
