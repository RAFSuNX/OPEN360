import { requireOrgAdmin } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import { SettingsForm } from '@/app/admin/settings/SettingsForm'

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const settings = await getOrgSettings(org.id)
  // Convert OrgSettings to Record<string, string> for SettingsForm
  const settingsMap: Record<string, string> = { ...settings }
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Admin</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
          Plan: <span style={{ fontWeight: '600', color: org.plan === 'PRO' ? 'var(--primary)' : 'var(--ink)' }}>
            {org.plan}
          </span>
        </p>
      </div>
      <SettingsForm initialSettings={settingsMap} />
    </div>
  )
}
