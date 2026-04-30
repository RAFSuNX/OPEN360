import { db } from '@/lib/db'
import { QuestionType } from '@prisma/client'

async function assertTemplateEditable(templateId: string) {
  const t = await db.questionTemplate.findUnique({ where: { id: templateId } })
  if (!t) throw new Error('Template not found')
  if (t.isDefault) throw new Error('Cannot edit the default template')
  const blocking = await db.reviewCycle.count({
    where: { templateId, status: { in: ['ACTIVE', 'CLOSED'] } },
  })
  if (blocking > 0) throw new Error('Cannot edit a template used by active or closed cycles')
}

export async function listTemplates() {
  return db.questionTemplate.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function getTemplate(id: string) {
  return db.questionTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function createTemplate(name: string, description?: string) {
  return db.questionTemplate.create({ data: { name, description } })
}

export async function updateTemplate(id: string, data: { name?: string; description?: string }) {
  await assertTemplateEditable(id)
  return db.questionTemplate.update({ where: { id }, data })
}

export async function deleteTemplate(id: string) {
  const t = await db.questionTemplate.findUnique({
    where: { id },
    include: { cycles: { select: { id: true, title: true } } },
  })
  if (!t) throw new Error('Template not found')
  if (t.isDefault) throw new Error('Cannot delete the default template')
  if (t.cycles.length > 0) {
    throw new Error(`Template is used by: ${t.cycles.map(c => c.title).join(', ')}`)
  }
  return db.questionTemplate.delete({ where: { id } })
}

export async function copyTemplate(id: string) {
  const source = await db.questionTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!source) throw new Error('Template not found')
  return db.questionTemplate.create({
    data: {
      name: `Copy of ${source.name}`,
      description: source.description,
      items: {
        create: source.items.map(item => ({
          text: item.text,
          type: item.type,
          ratingScale: item.ratingScale,
          category: item.category,
          sortOrder: item.sortOrder,
        })),
      },
    },
  })
}

export async function addTemplateItem(templateId: string, data: {
  text: string
  type: QuestionType
  ratingScale?: number
  category: string
  sortOrder: number
}) {
  await assertTemplateEditable(templateId)
  return db.questionTemplateItem.create({ data: { ...data, templateId } })
}

export async function updateTemplateItem(itemId: string, data: {
  text?: string
  type?: QuestionType
  ratingScale?: number | null
  category?: string
  sortOrder?: number
}) {
  const item = await db.questionTemplateItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')
  await assertTemplateEditable(item.templateId)
  return db.questionTemplateItem.update({ where: { id: itemId }, data })
}

export async function deleteTemplateItem(itemId: string) {
  const item = await db.questionTemplateItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')
  await assertTemplateEditable(item.templateId)
  return db.questionTemplateItem.delete({ where: { id: itemId } })
}
