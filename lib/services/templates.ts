import { db } from '@/lib/db'
import { QuestionType } from '@prisma/client'

async function assertTemplateEditable(templateId: string, orgId: string) {
  const t = await db.questionTemplate.findUnique({ where: { id: templateId } })
  if (!t || t.orgId !== orgId) throw new Error('Template not found')
  if (t.isDefault) throw new Error('Cannot edit the default template')
  const blocking = await db.reviewCycle.count({
    where: { templateId, status: { in: ['ACTIVE', 'CLOSED'] } },
  })
  if (blocking > 0) throw new Error('Cannot edit a template used by active or closed cycles')
}

export async function listTemplates(orgId: string) {
  return db.questionTemplate.findMany({
    where: { orgId },
    include: { _count: { select: { items: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function getTemplate(orgId: string, id: string) {
  return db.questionTemplate.findFirst({
    where: { id, orgId },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function createTemplate(orgId: string, name: string, description?: string) {
  return db.questionTemplate.create({ data: { orgId, name, description } })
}

export async function updateTemplate(orgId: string, id: string, data: { name?: string; description?: string }) {
  await assertTemplateEditable(id, orgId)
  return db.questionTemplate.update({ where: { id }, data })
}

export async function deleteTemplate(orgId: string, id: string) {
  const t = await db.questionTemplate.findUnique({
    where: { id },
    include: { cycles: { select: { id: true, title: true } } },
  })
  if (!t || t.orgId !== orgId) throw new Error('Template not found')
  if (t.isDefault) throw new Error('Cannot delete the default template')
  if (t.cycles.length > 0) {
    throw new Error(`Template is used by: ${t.cycles.map(c => c.title).join(', ')}`)
  }
  return db.questionTemplate.delete({ where: { id } })
}

export async function copyTemplate(orgId: string, id: string) {
  const source = await db.questionTemplate.findFirst({
    where: { id, orgId },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!source) throw new Error('Template not found')
  return db.questionTemplate.create({
    data: {
      orgId,
      name: `Copy of ${source.name}`,
      description: source.description,
      items: {
        create: source.items.map(item => ({
          text: item.text,
          selfText: item.selfText,
          type: item.type,
          ratingScale: item.ratingScale,
          category: item.category,
          applicableRole: item.applicableRole,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })
}

export async function addTemplateItem(orgId: string, templateId: string, data: {
  text: string
  selfText?: string
  type: QuestionType
  ratingScale?: number
  category: string
  applicableRole?: string
  sortOrder: number
}) {
  await assertTemplateEditable(templateId, orgId)
  return db.questionTemplateItem.create({ data: { ...data, templateId } })
}

export async function updateTemplateItem(orgId: string, itemId: string, data: {
  text?: string
  selfText?: string | null
  type?: QuestionType
  ratingScale?: number | null
  category?: string
  applicableRole?: string | null
  sortOrder?: number
}) {
  const item = await db.questionTemplateItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')
  await assertTemplateEditable(item.templateId, orgId)
  return db.questionTemplateItem.update({ where: { id: itemId }, data })
}

export async function deleteTemplateItem(orgId: string, itemId: string) {
  const item = await db.questionTemplateItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')
  await assertTemplateEditable(item.templateId, orgId)
  return db.questionTemplateItem.delete({ where: { id: itemId } })
}
