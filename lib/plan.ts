import { db } from '@/lib/db'

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanLimitError'
  }
}

const FREE_LIMITS = {
  employees: 10,
}

export async function checkEmployeeLimit(orgId: string): Promise<void> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      plan: true,
      _count: { select: { employees: { where: { isActive: true } } } },
    },
  })
  if (!org) throw new Error('Organization not found')

  if (org.plan === 'FREE' && org._count.employees >= FREE_LIMITS.employees) {
    throw new PlanLimitError(
      `Free plan is limited to ${FREE_LIMITS.employees} employees. Upgrade to Extended Plan to add more.`
    )
  }
}

export function isPro(plan: string): boolean {
  return plan === 'EXTENDED'
}
