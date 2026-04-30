import { requireAdmin } from '@/lib/auth'
import { getTemplate } from '@/lib/services/templates'
import { redirect } from 'next/navigation'
import TemplateDetail from './TemplateDetail'

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const template = await getTemplate(id)
  if (!template) redirect('/admin/templates')
  return <TemplateDetail template={template} />
}
