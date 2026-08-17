import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const Schema = z.object({
  orgName: z.string().min(1).max(200).trim(),
  plan: z.enum(['FREE', 'PRO']).default('FREE'),
})

function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

const MAX_SLUG_ATTEMPTS = 20

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const existing = await db.organization.findUnique({ where: { slug } })
    if (!existing) return slug
    slug = `${base}-${attempt}`
  }
  throw new Error('Could not generate a unique slug. Try a more specific organization name.')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = session.user.email

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { orgName, plan } = parsed.data

  const baseSlug = generateSlug(orgName)
  if (!baseSlug) return NextResponse.json({ error: 'Organization name must contain letters or numbers' }, { status: 400 })
  const slug = await ensureUniqueSlug(baseSlug)

  try {
    const { org } = await db.$transaction(async tx => {
      const org = await tx.organization.create({ data: { name: orgName, slug, plan } })
      await tx.allowlist.create({ data: { orgId: org.id, email } })
      await tx.employee.create({
        data: {
          orgId: org.id,
          name: email.split('@')[0],
          email,
          isAdmin: true,
        },
      })
      await tx.setting.create({ data: { orgId: org.id, key: 'onboarding_complete', value: 'false' } })
      return { org }
    })
    return NextResponse.json({ slug: org.slug }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Organization name already taken. Try a different name.' }, { status: 409 })
    }
    if (err instanceof Error && err.message.includes('unique slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('Create org error:', err)
    return NextResponse.json({ error: 'Failed to create organization. Please try again.' }, { status: 500 })
  }
}
