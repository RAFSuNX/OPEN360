import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateOrgSetting } from '@/lib/org'

const ALLOWED_KEYS = new Set([
  'org_name', 'org_logo_url', 'org_logo_email', 'org_tagline',
  'onboarding_complete', 'anonymity_threshold',
])

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const { db } = await import('@/lib/db')
  const settings = await db.setting.findMany({ where: { orgId } })
  return NextResponse.json(Object.fromEntries(settings.map(s => [s.key, s.value])))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = session.user.orgId

  const body = await req.json()
  const invalidKeys = Object.keys(body).filter(k => !ALLOWED_KEYS.has(k))
  if (invalidKeys.length > 0) {
    return NextResponse.json({ error: `Invalid setting keys: ${invalidKeys.join(', ')}` }, { status: 400 })
  }

  for (const [key, value] of Object.entries(body)) {
    await updateOrgSetting(orgId, key, String(value))
  }
  return NextResponse.json({ ok: true })
}
