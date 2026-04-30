import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { JWT } from 'next-auth/jwt'
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
      const allowed = await db.allowlist.findUnique({ where: { email } })
      // NextAuth converts redirect strings to AccessDenied - use false to trigger that
      if (!allowed) return false
      return true
    },
    async jwt({ token, trigger }) {
      // Enrich token once at sign-in, avoiding a DB hit on every request
      if (trigger === 'signIn' && token.email) {
        const employee = await db.employee.findUnique({
          where: { email: token.email },
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
  if (!session?.user?.isAdmin) throw new Error('Unauthorized')
  return session
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  return session
}
