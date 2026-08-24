import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { getOrgSettings } from '@/lib/org'
import { Relationship } from '@prisma/client'

export async function notifyAdminIfCycleComplete(orgId: string, cycleId: string) {
  const cycle = await db.reviewCycle.findFirst({
    where: { id: cycleId, orgId },
    include: { org: { select: { slug: true } } },
  })
  if (!cycle || cycle.status !== 'ACTIVE') return

  const pending = await db.reviewAssignment.count({
    where: { cycleId, submitted: false },
  })
  if (pending > 0) return

  const [admins, orgSettings] = await Promise.all([
    db.employee.findMany({ where: { orgId, isAdmin: true, isActive: true } }),
    getOrgSettings(orgId),
  ])

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const cycleUrl = `${appUrl}/org/${cycle.org.slug}/admin/cycles/${cycleId}`
  const orgName = orgSettings.org_name || 'OPEN360'

  await Promise.all(admins.map(admin =>
    sendEmail({
      to: admin.email,
      subject: `All reviews submitted — ${cycle.title}`,
      html: `
        <p>Hi ${admin.name},</p>
        <p>All reviewers have submitted their responses for <strong>${cycle.title}</strong>. The cycle is ready to close.</p>
        <p><a href="${cycleUrl}">View cycle in ${orgName}</a></p>
      `,
    })
  ))
}
