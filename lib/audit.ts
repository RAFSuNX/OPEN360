import { db } from '@/lib/db'

export type AuditAction =
  | 'employee.create'
  | 'employee.update'
  | 'employee.delete'
  | 'cycle.create'
  | 'cycle.activate'
  | 'cycle.send_employee'
  | 'cycle.close'
  | 'cycle.delete'
  | 'assignment.auto_assign'
  | 'assignment.delete'
  | 'template.create'
  | 'template.update'
  | 'template.delete'
  | 'template.copy'
  | 'settings.update'
  | 'allowlist.add'
  | 'allowlist.remove'

export async function writeAudit(opts: {
  orgId: string
  actorEmail: string
  action: AuditAction
  target?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await db.auditLog.create({
      data: {
        orgId: opts.orgId,
        actorEmail: opts.actorEmail,
        action: opts.action,
        target: opts.target ?? null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    })
  } catch {
    // Audit failures must never break the main operation
    console.error('[audit] write failed:', opts)
  }
}

export async function getAuditLogs(orgId: string, limit = 100) {
  return db.auditLog.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
