import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  await requireAdmin()
  let map: Record<string, string> = { anonymity_threshold: '1' }
  try {
    const settings = await db.setting.findMany()
    map = { ...map, ...Object.fromEntries(settings.map(s => [s.key, s.value])) }
  } catch { /* table may not exist yet */ }
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Configuration</p>
        <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>Settings</h1>
      </div>
      <SettingsForm initialSettings={map} />
    </div>
  )
}
