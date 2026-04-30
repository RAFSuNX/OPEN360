import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { key: 'org_logo_email' } })
    const dataUrl = setting?.value ?? ''

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return new NextResponse(null, { status: 404 })
    }

    // Parse data URL: data:[mime];base64,[data]
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) return new NextResponse(null, { status: 404 })

    const mimeType = matches[1]
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'].includes(mimeType)) {
      return new NextResponse(null, { status: 415 })
    }
    const base64Data = matches[2]
    if (base64Data.length > 2 * 1024 * 1024) {
      return new NextResponse(null, { status: 413 })
    }
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.length > 1.5 * 1024 * 1024) {
      return new NextResponse(null, { status: 413 })
    }

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
