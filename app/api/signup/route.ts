import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const SignupSchema = z.object({
  orgName: z.string().min(1).max(200).trim(),
  adminEmail: z.string().email().max(300).toLowerCase(),
  plan: z.enum(['FREE', 'EXTENDED']).default('FREE'),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
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
  // Rate limit: 5 signups per IP per hour
  const ip = getClientIp(req)
  const rl = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const parsed = SignupSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { orgName, adminEmail, plan } = parsed.data

  const baseSlug = generateSlug(orgName)
  if (!baseSlug) {
    return NextResponse.json({ error: 'Organization name must contain letters or numbers' }, { status: 400 })
  }
  const slug = await ensureUniqueSlug(baseSlug)

  try {
    const { org } = await db.$transaction(async tx => {
      const org = await tx.organization.create({
        data: { name: orgName, slug, plan },
      })
      await tx.allowlist.create({
        data: { orgId: org.id, email: adminEmail },
      })
      await tx.employee.create({
        data: {
          orgId: org.id,
          name: adminEmail.split('@')[0],
          email: adminEmail,
          isAdmin: true,
        },
      })
      await tx.setting.createMany({
        data: [
          { orgId: org.id, key: 'onboarding_complete', value: 'true' },
          { orgId: org.id, key: 'org_name', value: orgName },
        ],
      })
      return { org }
    })

    return NextResponse.json({ slug: org.slug }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Slug conflict from a concurrent signup — ask user to try again
      return NextResponse.json({ error: 'Organization name already taken. Please try a different name.' }, { status: 409 })
    }
    if (err instanceof Error && err.message.includes('unique slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Failed to create organization. Please try again.' }, { status: 500 })
  }
}
