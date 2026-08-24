import { requireOrgAdmin } from '@/lib/org-context'
import { getTemplate } from '@/lib/services/templates'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TemplateDetail from '@/app/admin/templates/[id]/TemplateDetail'
import { TemplateCopyButton, TemplateDeleteButton } from '@/app/admin/templates/TemplateActions'

export default async function OrgTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const { org } = await requireOrgAdmin(slug)

  const [template, employeeRoles] = await Promise.all([
    getTemplate(org.id, id),
    db.employee.findMany({
      where: { orgId: org.id, isActive: true, role: { not: null } },
      select: { role: true },
      distinct: ['role'],
    }),
  ])
  if (!template) notFound()

  const roles = employeeRoles.map(e => e.role as string).sort()

  return (
    <div>
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px' }}>
        <Link
          href={`/org/${slug}/admin/templates`}
          style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}
        >
          ← Templates
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TemplateCopyButton templateId={template.id} orgSlug={slug} />
          {!template.isDefault && (
            <TemplateDeleteButton templateId={template.id} templateName={template.name} />
          )}
        </div>
      </div>

      <TemplateDetail template={template} roles={roles} />
    </div>
  )
}
