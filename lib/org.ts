import { db } from '@/lib/db'

export interface OrgSettings {
  org_name: string
  org_logo_url: string
  org_logo_email: string
  org_tagline: string
  onboarding_complete: string
}

export async function getOrgSettings(): Promise<OrgSettings> {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ['org_name', 'org_logo_url', 'org_logo_email', 'org_tagline', 'onboarding_complete'] } },
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return {
      org_name: map['org_name'] ?? '',
      org_logo_url: map['org_logo_url'] ?? '',
      org_logo_email: map['org_logo_email'] ?? '',
      org_tagline: map['org_tagline'] ?? '',
      onboarding_complete: map['onboarding_complete'] ?? 'false',
    }
  } catch {
    return { org_name: '', org_logo_url: '', org_logo_email: '', org_tagline: '', onboarding_complete: 'false' }
  }
}

export function isOnboardingComplete(org: OrgSettings): boolean {
  return org.onboarding_complete === 'true' && org.org_name.trim().length > 0
}
