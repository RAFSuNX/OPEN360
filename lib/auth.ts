import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { JWT } from 'next-auth/jwt'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email
      if (!email) return false
      // Check individual email allowlist (any org)
      const allowed = await db.allowlist.findFirst({ where: { email } })
      if (allowed) return true
      // Check domain allowlist (any org)
      const domain = email.split('@')[1]
      if (domain) {
        const domainAllowed = await db.allowedDomain.findFirst({ where: { domain } })
        if (domainAllowed) return true
      }
      return false
    },

    async jwt({ token }) {
      if (token.email) {
        const employee = await db.employee.findFirst({
          where: { email: token.email as string, isActive: true },
          select: {
            id: true,
            isAdmin: true,
            isSuperAdmin: true,
            orgId: true,
            org: { select: { slug: true } },
          },
        })
        token.employeeId  = employee?.id ?? null
        token.isAdmin     = employee?.isAdmin ?? false
        token.isSuperAdmin = employee?.isSuperAdmin ?? false
        token.orgId       = employee?.orgId ?? null
        token.orgSlug     = employee?.org?.slug ?? null
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
        }
        session.user.id          = t.employeeId ?? ''
        session.user.isAdmin     = t.isAdmin ?? false
        session.user.isSuperAdmin = t.isSuperAdmin ?? false
        session.user.orgId       = t.orgId ?? ''
        session.user.orgSlug     = t.orgSlug ?? ''
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
  if (!session.user.isAdmin) redirect(`/org/${session.user.orgSlug}/dashboard`)
  return session
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return session
}
