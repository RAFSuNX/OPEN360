import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      isAdmin: boolean
      isSuperAdmin: boolean
      orgId: string
      orgSlug: string
      multiOrg: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    employeeId?: string | null
    isAdmin?: boolean
    isSuperAdmin?: boolean
    orgId?: string | null
    orgSlug?: string | null
    multiOrg?: boolean
  }
}
