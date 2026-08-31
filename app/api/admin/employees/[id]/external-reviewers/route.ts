import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Relationship } from '@prisma/client'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id } = await params

  const links = await db.externalReviewerLink.findMany({
    where: { revieweeId: id, orgId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(links)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id: revieweeId } = await params

  const { name, email, relationship } = await req.json()
  if (!name || !email || !relationship) {
    return NextResponse.json({ error: 'name, email, and relationship are required' }, { status: 400 })
  }
  if (!['PEER', 'DIRECT_REPORT'].includes(relationship)) {
    return NextResponse.json({ error: 'relationship must be PEER or DIRECT_REPORT' }, { status: 400 })
  }

  const reviewee = await db.employee.findFirst({ where: { id: revieweeId, orgId } })
  if (!reviewee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const link = await db.externalReviewerLink.upsert({
    where: { revieweeId_reviewerEmail: { revieweeId, reviewerEmail: email } },
    update: { reviewerName: name, relationship: relationship as Relationship },
    create: { orgId, revieweeId, reviewerName: name, reviewerEmail: email, relationship: relationship as Relationship },
  })
  return NextResponse.json(link, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth
  const { id: revieweeId } = await params

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  await db.externalReviewerLink.deleteMany({ where: { revieweeId, orgId, reviewerEmail: email } })
  return NextResponse.json({ ok: true })
}
