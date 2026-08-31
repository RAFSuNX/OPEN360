import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'

const emailSchema = z.string().email()

export class EmployeeExistsError extends Error {
  constructor(email: string) {
    super(`Employee with email ${email} already exists`)
    this.name = 'EmployeeExistsError'
  }
}

export async function listEmployees(orgId: string) {
  return db.employee.findMany({
    where: { orgId, isActive: true, isExternal: false },
    include: {
      manager: { select: { id: true, name: true } },
      externalReviewLinks: { select: { reviewerName: true, reviewerEmail: true, relationship: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createEmployee(orgId: string, data: {
  name: string
  email: string
  employeeId?: string
  department?: string
  role?: string
  managerId?: string
}) {
  try {
    return await db.$transaction(async tx => {
      await tx.allowlist.upsert({
        where: { orgId_email: { orgId, email: data.email } },
        update: {},
        create: { orgId, email: data.email },
      })
      return tx.employee.create({ data: { ...data, orgId } })
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new EmployeeExistsError(data.email)
    }
    throw e
  }
}

export interface CsvRow {
  name: string
  email: string
  manager_email?: string
  department?: string
  role?: string
}

export interface ImportResult {
  imported: number
  errors: string[]
}

export async function importEmployeesFromCsv(orgId: string, rows: CsvRow[]): Promise<ImportResult> {
  const errors: string[] = []
  const validRows: (CsvRow & { managerId: string | null })[] = []

  const existingEmployees = await db.employee.findMany({
    where: { orgId },
    select: { id: true, email: true },
  })
  const emailToId = new Map(existingEmployees.map(e => [e.email, e.id]))

  for (const row of rows) {
    if (!row.name || !row.email) {
      errors.push(`Row missing name or email: ${JSON.stringify(row)}`)
      continue
    }
    if (!emailSchema.safeParse(row.email).success) {
      errors.push(`Invalid email address: ${row.email}`)
      continue
    }
    let managerId: string | null = null
    if (row.manager_email) {
      managerId = emailToId.get(row.manager_email) ?? null
      if (!managerId) {
        errors.push(`Manager not found for ${row.email}: ${row.manager_email}`)
        continue
      }
    }
    validRows.push({ ...row, managerId })
  }

  if (validRows.length === 0) return { imported: 0, errors }

  await db.$transaction(async tx => {
    await tx.allowlist.createMany({
      data: validRows.map(r => ({ orgId, email: r.email })),
      skipDuplicates: true,
    })
    for (const row of validRows) {
      await tx.employee.upsert({
        where: { orgId_email: { orgId, email: row.email } },
        update: { name: row.name, department: row.department, role: row.role, managerId: row.managerId },
        create: { orgId, name: row.name, email: row.email, department: row.department, role: row.role, managerId: row.managerId },
      })
    }
  })

  return { imported: validRows.length, errors }
}

async function wouldCreateManagerCycle(orgId: string, employeeId: string, newManagerId: string): Promise<boolean> {
  let currentId: string = newManagerId
  const MAX_DEPTH = 50
  for (let i = 0; i < MAX_DEPTH; i++) {
    if (currentId === employeeId) return true
    const mgr = await db.employee.findFirst({
      where: { id: currentId, orgId },
      select: { managerId: true },
    })
    if (!mgr?.managerId) return false
    currentId = mgr.managerId
  }
  return true // chain too deep — treat as cycle
}

export async function updateEmployee(orgId: string, id: string, data: {
  name?: string
  employeeId?: string | null
  department?: string | null
  role?: string | null
  managerId?: string | null
  isAdmin?: boolean
}) {
  if (data.managerId) {
    if (data.managerId === id) throw new Error('An employee cannot be their own manager')
    if (await wouldCreateManagerCycle(orgId, id, data.managerId)) {
      throw new Error('This manager assignment would create a circular reporting chain')
    }
  }
  return db.employee.update({ where: { id, orgId }, data })
}

export async function deactivateEmployee(orgId: string, id: string) {
  return db.$transaction([
    // Void pending assignments where this employee is a reviewer in active cycles
    db.reviewAssignment.deleteMany({
      where: {
        reviewerId: id,
        submitted: false,
        cycle: { orgId, status: 'ACTIVE' },
      },
    }),
    db.employee.update({ where: { id, orgId }, data: { isActive: false } }),
  ])
}

export async function getEmployee(orgId: string, id: string) {
  return db.employee.findFirst({ where: { id, orgId } })
}
