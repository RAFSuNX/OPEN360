import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'
import { Relationship } from '@prisma/client'

export async function notifyAdminIfCycleComplete(orgId: string, cycleId: string) {
  const cycle = await db.reviewCycle.findFirst({ where: { id: cycleId, orgId } })
  if (!cycle || cycle.status !== 'ACTIVE') return

  const pending = await db.reviewAssignment.count({
    where: { cycleId, submitted: false, NOT: { relationship: Relationship.SELF } },
  })
  if (pending > 0) return

  const admins = await db.employee.findMany({ where: { orgId, isAdmin: true, isActive: true } })
  const org = await getOrgSettings(orgId)
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `All reviews submitted — ${cycle.title}`,
      html: `
        <p>Hi ${admin.name},</p>
        <p>All reviewers have submitted their responses for <strong>${cycle.title}</strong>. The cycle is ready to close.</p>
        <p><a href="${appUrl}/org/${/* org slug needed */''}/admin/cycles/${cycleId}">View cycle</a></p>
      `,
    })
  }
}
