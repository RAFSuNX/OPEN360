import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { listTemplates, createTemplate } from '@/lib/services/templates'

export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  return NextResponse.json(await listTemplates(orgId))
}

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  try {
    const t = await createTemplate(orgId, name, description)
    return NextResponse.json(t, { status: 201 })
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}
