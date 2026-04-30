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
      const allowed = await db.allowlist.findUnique({ where: { email } })
      // NextAuth converts redirect strings to AccessDenied - use false to trigger that
      if (!allowed) return false
      return true
    },
    async jwt({ token, trigger }) {
      // [P1] Re-fetch on every refresh so admin role changes take effect without re-login.
      // Only skip on the very first sign-in call since the data will be fresh anyway.
      // Cost: one lightweight DB query per token refresh (every ~30s by default).
      if (token.email && (trigger === 'signIn' || !token.employeeId)) {
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
