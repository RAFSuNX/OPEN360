import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'
import { Relationship } from '@prisma/client'

export async function notifyAdminIfCycleComplete(cycleId: string) {
  const cycle = await db.reviewCycle.findUnique({ where: { id: cycleId } })
  if (!cycle || cycle.status !== 'ACTIVE') return

  // Check if all non-self assignments are submitted
  const pending = await db.reviewAssignment.count({
    where: { cycleId, submitted: false, NOT: { relationship: Relationship.SELF } },
  })
  if (pending > 0) return

  // All done - notify admins
  const admins = await db.employee.findMany({ where: { isAdmin: true, isActive: true } })
  const org = await getOrgSettings()
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `All reviews submitted -- ${cycle.title}`,
      html: `
        <p>Hi ${admin.name},</p>
        <p>All reviewers have submitted their responses for <strong>${cycle.title}</strong>. The cycle is ready to close.</p>
        <p><a href="${appUrl}/admin/cycles/${cycleId}">Close the cycle and notify reviewees</a></p>
      `,
    })
  }
}
