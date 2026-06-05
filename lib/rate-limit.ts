/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window algorithm.
 * For production, replace with a Redis-backed implementation.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and increment rate limit for a given key.
 * @param key      Unique identifier (e.g. IP + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Extract the real client IP from a Request object.
 * Works with Vercel, Cloudflare, and direct connections.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  )
}
