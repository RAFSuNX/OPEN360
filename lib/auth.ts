import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'
import { redirect } from 'next/navigation'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

async function isEmailAllowed(email: string): Promise<boolean> {
  const allowed = await db.allowlist.findFirst({ where: { email } })
  if (allowed) return true
  const domain = email.split('@')[1]
  if (domain) {
    const domainAllowed = await db.allowedDomain.findFirst({ where: { domain } })
    if (domainAllowed) return true
  }
  return false
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code:  { label: 'Code',  type: 'text'  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null
        const email = credentials.email.toLowerCase()
        const codeHash = createHash('sha256').update(credentials.code.trim()).digest('hex')

        const stored = await redis.get(`otp:${email}`)
        if (!stored || stored !== codeHash) return null

        // Delete after use — one-time only
        await redis.del(`otp:${email}`)

        return { id: email, email, name: email }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email
      if (!email) return false
      // OTP provider already verified — skip allowlist check
      if (account?.provider === 'otp') return true
      return isEmailAllowed(email)
    },

    async jwt({ token, trigger }) {
      // Only hit the DB on sign-in, explicit session update, or the first time
      if (trigger === 'signIn' || trigger === 'signUp' || trigger === 'update' || !token.employeeId) {
        if (token.email) {
          const employees = await db.employee.findMany({
            where: { email: token.email as string, isActive: true },
            select: {
              id: true,
              isAdmin: true,
              isSuperAdmin: true,
              orgId: true,
              org: { select: { slug: true } },
            },
          })
          // For single-org users, store org context in token for convenience.
          // For multi-org users, leave orgId/orgSlug null — org context is derived from URL slug.
          const single = employees.length === 1 ? employees[0] : null
          token.employeeId   = single?.id ?? (employees[0]?.id ?? null)
          token.isAdmin      = single?.isAdmin ?? false
          token.isSuperAdmin = employees.some(e => e.isSuperAdmin)
          token.orgId        = single?.orgId ?? null
          token.orgSlug      = single?.org?.slug ?? null
          token.multiOrg     = employees.length > 1
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const t = token as JWT & {
          employeeId: string
          isAdmin: boolean
          isSuperAdmin: boolean
          orgId: string
          orgSlug: string
          multiOrg: boolean
        }
        session.user.id           = t.employeeId ?? ''
        session.user.isAdmin      = t.isAdmin ?? false
        session.user.isSuperAdmin = t.isSuperAdmin ?? false
        session.user.orgId        = t.orgId ?? ''
        session.user.orgSlug      = t.orgSlug ?? ''
        session.user.multiOrg     = t.multiOrg ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) {
    redirect(session.user.orgSlug ? `/org/${session.user.orgSlug}/dashboard` : '/orgs')
  }
  return session
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return session
}

/**
 * API-route helper — replaces the repeated 3-line auth check in every admin route.
 * Returns { session, orgId } on success, or a 401/403 NextResponse to return directly.
 */
export async function getAdminSession(): Promise<
  | { ok: true; orgId: string; email: string }
  | { ok: false; response: Response }
> {
  const { NextResponse } = await import('next/server')
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const orgId = session.user.orgId
  if (!orgId) {
    return { ok: false, response: NextResponse.json({ error: 'No organization found for this account' }, { status: 403 }) }
  }
  return { ok: true, orgId, email: session.user.email ?? '' }
}
