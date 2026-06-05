import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
  const { orgName, adminEmail } = await req.json()

  if (!orgName || typeof orgName !== 'string' || !orgName.trim()) {
    return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
  }
  if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.includes('@')) {
    return NextResponse.json({ error: 'Valid admin email is required' }, { status: 400 })
  }

  const cleanName  = orgName.trim()
  const cleanEmail = adminEmail.trim().toLowerCase()

  // Check if this email is already in an org
  const existingEmployee = await db.employee.findFirst({
    where: { email: cleanEmail },
    include: { org: { select: { slug: true, name: true } } },
  })
  if (existingEmployee) {
    return NextResponse.json({
      error: `This email already belongs to organization "${existingEmployee.org.name}". Sign in instead.`,
    }, { status: 409 })
  }

  const baseSlug = generateSlug(cleanName)
  if (!baseSlug) {
    return NextResponse.json({ error: 'Organization name must contain letters or numbers' }, { status: 400 })
  }
  const slug = await ensureUniqueSlug(baseSlug)

  try {
    const { org } = await db.$transaction(async tx => {
      const org = await tx.organization.create({
        data: { name: cleanName, slug },
      })
      await tx.allowlist.create({
        data: { orgId: org.id, email: cleanEmail },
      })
      await tx.employee.create({
        data: {
          orgId: org.id,
          name: cleanEmail.split('@')[0], // placeholder name — updated in onboarding
          email: cleanEmail,
          isAdmin: true,
        },
      })
      // Seed default settings
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
