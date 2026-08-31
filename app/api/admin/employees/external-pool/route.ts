import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Returns all distinct external reviewers added across the org
export async function GET() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const links = await db.externalReviewerLink.findMany({
    where: { orgId },
    select: { reviewerName: true, reviewerEmail: true },
    distinct: ['reviewerEmail'],
    orderBy: { reviewerName: 'asc' },
  })

  return NextResponse.json(links)
}
