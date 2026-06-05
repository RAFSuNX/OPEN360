import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Accept ?org=slug to scope to the correct org, fallback to first org (single-tenant legacy)
    const slug = req.nextUrl.searchParams.get('org')

    let orgId: string | undefined
    if (slug) {
      const org = await db.organization.findUnique({ where: { slug }, select: { id: true } })
      orgId = org?.id
    } else {
      // Legacy: find first active org
      const org = await db.organization.findFirst({ where: { isActive: true }, select: { id: true } })
      orgId = org?.id
    }

    if (!orgId) return new NextResponse(null, { status: 404 })

    const setting = await db.setting.findFirst({
      where: { orgId, key: 'org_logo_email' },
    })
    const dataUrl = setting?.value ?? ''

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return new NextResponse(null, { status: 404 })
    }

    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) return new NextResponse(null, { status: 404 })

    const mimeType = matches[1]
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(mimeType)) return new NextResponse(null, { status: 415 })

    const base64Data = matches[2]
    if (base64Data.length > 2 * 1024 * 1024) return new NextResponse(null, { status: 413 })

    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > 1.5 * 1024 * 1024) return new NextResponse(null, { status: 413 })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': String(buffer.length),
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
