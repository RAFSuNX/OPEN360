import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash, randomInt } from 'node:crypto'
import { redis } from '@/lib/redis'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const Schema = z.object({ email: z.string().email().toLowerCase() })

const OTP_TTL = 10 * 60 // 10 minutes in seconds

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`otp:${ip}`, 5, 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const { email } = parsed.data

  // Check allowlist — only registered emails can get an OTP
  const allowed = await db.allowlist.findFirst({ where: { email } })
  if (!allowed) {
    const domain = email.split('@')[1]
    const domainAllowed = domain ? await db.allowedDomain.findFirst({ where: { domain } }) : null
    if (!domainAllowed) {
      // Don't reveal whether email exists — return ok either way
      return NextResponse.json({ ok: true })
    }
  }

  const code = String(randomInt(100000, 999999))
  // Store hash in Redis with TTL — key is per-email, one active code at a time
  await redis.set(`otp:${email}`, hashCode(code), 'EX', OTP_TTL)

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  await sendEmail({
    to: email,
    subject: `Your OPEN360 login code: ${code}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:600;margin-bottom:8px">Your login code</h2>
        <p style="color:#666;margin-bottom:24px">Enter this code in OPEN360 to sign in. It expires in 10 minutes.</p>
        <div style="background:#f4f1ea;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace">${code}</span>
        </div>
        <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email. Sent from <a href="${appUrl}">${appUrl}</a></p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
