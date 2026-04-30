import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export class EmployeeExistsError extends Error {
  constructor(email: string) {
    super(`Employee with email ${email} already exists`)
    this.name = 'EmployeeExistsError'
  }
}

export async function listEmployees() {
  return db.employee.findMany({
    where: { isActive: true },
    include: { manager: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createEmployee(data: {
  name: string
  email: string
  employeeId?: string
  department?: string
  role?: string
  managerId?: string
}) {
  // [P2] Wrap in transaction so allowlist and employee are always in sync.
  // If employee creation fails, the allowlist entry is rolled back too.
  try {
    return await db.$transaction(async tx => {
      await tx.allowlist.upsert({
        where: { email: data.email },
        update: {},
        create: { email: data.email },
      })
      return tx.employee.create({ data })
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

export async function importEmployeesFromCsv(rows: CsvRow[]): Promise<ImportResult> {
  const errors: string[] = []
  const validRows: (CsvRow & { managerId: string | null })[] = []

  // Pre-fetch all existing employees once to resolve manager emails without N+1 queries
  const existingEmployees = await db.employee.findMany({ select: { id: true, email: true } })
  const emailToId = new Map(existingEmployees.map(e => [e.email, e.id]))

  for (const row of rows) {
    if (!row.name || !row.email) {
      errors.push(`Row missing name or email: ${JSON.stringify(row)}`)
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

  // Batch allowlist upserts then employee upserts in a transaction
  await db.$transaction(async tx => {
    await tx.allowlist.createMany({
      data: validRows.map(r => ({ email: r.email })),
      skipDuplicates: true,
    })
    for (const row of validRows) {
      await tx.employee.upsert({
        where: { email: row.email },
        update: { name: row.name, department: row.department, role: row.role, managerId: row.managerId },
        create: { name: row.name, email: row.email, department: row.department, role: row.role, managerId: row.managerId },
      })
    }
  })

  return { imported: validRows.length, errors }
}

export async function updateEmployee(id: string, data: {
  name?: string
  employeeId?: string | null
  department?: string | null
  role?: string | null
  managerId?: string | null
  isAdmin?: boolean
}) {
  return db.employee.update({ where: { id }, data })
}
