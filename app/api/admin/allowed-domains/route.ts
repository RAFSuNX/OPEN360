import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  await requireAdmin()
  const domains = await db.allowedDomain.findMany({ orderBy: { addedAt: 'asc' } })
  return NextResponse.json(domains)
}

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { domain } = await req.json()
  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
  }
  const cleaned = domain.trim().toLowerCase().replace(/^@/, '')
  if (!cleaned || cleaned.includes('@') || !cleaned.includes('.')) {
    return NextResponse.json({ error: 'Invalid domain format. Use: company.com' }, { status: 400 })
  }
  try {
    const entry = await db.allowedDomain.create({ data: { domain: cleaned } })
    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest) {
  await requireAdmin()
  const { domain } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
  await db.allowedDomain.deleteMany({ where: { domain } })
  return NextResponse.json({ ok: true })
}
