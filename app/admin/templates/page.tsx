import { requireAdmin } from '@/lib/auth'
import { listTemplates } from '@/lib/services/templates'
import Link from 'next/link'
import TemplateActions, { TemplateCopyButton, TemplateDeleteButton } from './TemplateActions'

export default async function TemplatesPage() {
  await requireAdmin()
  const templates = await listTemplates()

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="section-label" style={{ marginBottom: '8px' }}>Question Templates</p>
          <h1 style={{ fontSize: '26px', fontWeight: '400', color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>Templates</h1>
        </div>
        <TemplateActions />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {templates.map(t => (
          <div key={t.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)', margin: 0 }}>{t.name}</p>
                {t.isDefault && <span className="badge" style={{ fontSize: '10px' }}>Default</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>{t._count.items} questions</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              <TemplateCopyButton templateId={t.id} />
              {!t.isDefault && (
                <>
                  <Link href={`/admin/templates/${t.id}`}>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>Edit</button>
                  </Link>
                  <TemplateDeleteButton templateId={t.id} templateName={t.name} />
                </>
              )}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No templates yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
