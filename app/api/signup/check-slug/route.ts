import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const existing = await db.organization.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { id: true },
  })

  return NextResponse.json({ available: !existing })
}
