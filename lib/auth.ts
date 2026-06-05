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
      // Check individual email allowlist
      const allowed = await db.allowlist.findUnique({ where: { email } })
      if (allowed) return true
      // Check domain allowlist (e.g. allow anyone @company.com)
      const domain = email.split('@')[1]
      if (domain) {
        const domainAllowed = await db.allowedDomain.findUnique({ where: { domain } })
        if (domainAllowed) return true
      }
      return false
    },
    async jwt({ token }) {
      if (token.email) {
        const employee = await db.employee.findUnique({
          where: { email: token.email as string },
          select: { id: true, isAdmin: true },
        })
        token.employeeId = employee?.id ?? null
        token.isAdmin = employee?.isAdmin ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as JWT & { employeeId: string }).employeeId ?? ''
        session.user.isAdmin = (token as JWT & { isAdmin: boolean }).isAdmin ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')
  return session
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  return session
}
