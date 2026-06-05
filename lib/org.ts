import { db } from '@/lib/db'

export interface OrgSettings {
  org_name: string
  org_logo_url: string
  org_logo_email: string
  org_tagline: string
  onboarding_complete: string
}

const SETTING_KEYS = ['org_name', 'org_logo_url', 'org_logo_email', 'org_tagline', 'onboarding_complete'] as const

export async function getOrgSettings(orgId: string): Promise<OrgSettings> {
  try {
    const settings = await db.setting.findMany({
      where: { orgId, key: { in: [...SETTING_KEYS] } },
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return {
      org_name:            map['org_name']            ?? '',
      org_logo_url:        map['org_logo_url']        ?? '',
      org_logo_email:      map['org_logo_email']      ?? '',
      org_tagline:         map['org_tagline']         ?? '',
      onboarding_complete: map['onboarding_complete'] ?? 'false',
    }
  } catch {
    return { org_name: '', org_logo_url: '', org_logo_email: '', org_tagline: '', onboarding_complete: 'false' }
  }
}

export async function updateOrgSetting(orgId: string, key: string, value: string) {
  return db.setting.upsert({
    where: { orgId_key: { orgId, key } },
    update: { value },
    create: { orgId, key, value },
  })
}

export function isOnboardingComplete(org: OrgSettings): boolean {
  return org.onboarding_complete === 'true' && org.org_name.trim().length > 0
}
