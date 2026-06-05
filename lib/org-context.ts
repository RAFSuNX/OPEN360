import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export type OrgContext = {
  org: { id: string; name: string; slug: string; plan: string }
  employee: { id: string; email: string; isAdmin: boolean; isSuperAdmin: boolean }
  session: Session
}

/**
 * Validates the current user belongs to the org identified by slug.
 * Redirects if not authenticated or not a member.
 * Use this in every org-scoped page/layout.
 */
export async function getOrgContext(slug: string): Promise<OrgContext> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect(`/login?next=/org/${slug}`)

  const org = await db.organization.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, plan: true },
  })
  if (!org) redirect('/not-found')

  const employee = await db.employee.findFirst({
    where: { email: session.user.email, orgId: org.id, isActive: true },
    select: { id: true, email: true, isAdmin: true, isSuperAdmin: true },
  })
  if (!employee) redirect(`/login?error=not-member&next=/org/${slug}`)

  return { org, employee, session }
}

/**
 * Requires the current user to be an admin of the org.
 * Redirects to dashboard if not admin.
 */
export async function requireOrgAdmin(slug: string): Promise<OrgContext> {
  const ctx = await getOrgContext(slug)
  if (!ctx.employee.isAdmin) redirect(`/org/${slug}/dashboard`)
  return ctx
}

/**
 * Requires the current user to be a platform super admin.
 * Super admins can access all orgs.
 */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const employee = await db.employee.findFirst({
    where: { email: session.user.email, isSuperAdmin: true },
    select: { id: true, email: true },
  })
  if (!employee) redirect('/')

  return { session, employee }
}
