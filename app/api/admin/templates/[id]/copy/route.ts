import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { copyTemplate } from '@/lib/services/templates'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id } = await params
  try {
    const copy = await copyTemplate(orgId, id)
    return NextResponse.json(copy, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
