import { requireOrgAdmin } from '@/lib/org-context'
import { getOrgSettings } from '@/lib/org'
import { getAuditLogs } from '@/lib/audit'
import { SettingsForm } from '@/app/admin/settings/SettingsForm'
import { BillingSection } from './BillingSection'

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const [settings, auditLogs] = await Promise.all([
    getOrgSettings(org.id),
    getAuditLogs(org.id, 50),
  ])
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

      <BillingSection plan={org.plan} slug={slug} />

      <SettingsForm initialSettings={settingsMap} />

      {/* Audit Log */}
      <div style={{ marginTop: '48px' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>Audit Log</p>
        {auditLogs.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No admin actions recorded yet.</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                    {['Time', 'Actor', 'Action', 'Target'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--muted)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: i < auditLogs.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--muted)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--body)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {log.actorEmail}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                          background: 'var(--surface-strong)', padding: '2px 8px',
                          borderRadius: '4px', color: 'var(--ink)',
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '12px' }}>
                        {log.target ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

