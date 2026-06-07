import { requireOrgAdmin } from '@/lib/org-context'
import { listTemplates } from '@/lib/services/templates'
import Link from 'next/link'
import TemplateActions, { TemplateCopyButton, TemplateDeleteButton } from '@/app/admin/templates/TemplateActions'

export default async function OrgTemplatesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org } = await requireOrgAdmin(slug)
  const templates = await listTemplates(org.id)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <p className="section-label" style={{ marginBottom: '8px' }}>Admin</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
          <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
            Question Templates
          </h1>
          <TemplateActions />
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px', maxWidth: '560px' }}>
          Templates group questions for reuse across review cycles.
          Assign a template when creating a cycle to snapshot its questions.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            No templates yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const }}>
              <Link href={`/org/${slug}/admin/templates/${t.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {t.name}
                  {t.isDefault && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const, color: 'var(--muted)', background: 'var(--surface-strong)',
                      padding: '2px 6px', borderRadius: '4px' }}>
                      Default
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  {t._count.items} question{t._count.items !== 1 ? 's' : ''}
                </p>
              </Link>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <TemplateCopyButton templateId={t.id} />
                {!t.isDefault && (
                  <TemplateDeleteButton templateId={t.id} templateName={t.name} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
