import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { updateOrgSetting, OrgSettingKey } from '@/lib/org'
import { db } from '@/lib/db'

// Canonical allowed keys live in lib/org.ts as OrgSettingKey — no duplicate set needed here.
const WRITABLE_KEYS = new Set<string>([
  'org_name', 'org_logo_url', 'org_logo_email', 'org_tagline',
  'onboarding_complete', 'anonymity_threshold',
])

export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const settings = await db.setting.findMany({ where: { orgId } })
  return NextResponse.json(Object.fromEntries(settings.map(s => [s.key, s.value])))
}

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const body = await req.json()
  const invalidKeys = Object.keys(body).filter(k => !WRITABLE_KEYS.has(k))
  if (invalidKeys.length > 0) {
    return NextResponse.json({ error: `Invalid setting keys: ${invalidKeys.join(', ')}` }, { status: 400 })
  }

  for (const [key, value] of Object.entries(body)) {
    await updateOrgSetting(orgId, key as OrgSettingKey, String(value))
  }
  return NextResponse.json({ ok: true })
}
