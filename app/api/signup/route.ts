import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const SignupSchema = z.object({
  orgName: z.string().min(1).max(200).trim(),
  adminEmail: z.string().email().max(300).toLowerCase(),
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

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await db.organization.findUnique({ where: { slug } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
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

  const { orgName, adminEmail } = parsed.data

  // Check if this email is already in an org
  const existingEmployee = await db.employee.findFirst({
    where: { email: adminEmail },
    include: { org: { select: { slug: true, name: true } } },
  })
  if (existingEmployee) {
    return NextResponse.json({
      error: `This email already belongs to organization "${existingEmployee.org.name}". Sign in instead.`,
    }, { status: 409 })
  }

  const baseSlug = generateSlug(orgName)
  if (!baseSlug) {
    return NextResponse.json({ error: 'Organization name must contain letters or numbers' }, { status: 400 })
  }
  const slug = await ensureUniqueSlug(baseSlug)

  try {
    const { org } = await db.$transaction(async tx => {
      const org = await tx.organization.create({
        data: { name: orgName, slug },
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
      await tx.setting.create({
        data: { orgId: org.id, key: 'onboarding_complete', value: 'false' },
      })
      return { org }
    })

    return NextResponse.json({ slug: org.slug }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Failed to create organization. Please try again.' }, { status: 500 })
  }
}
