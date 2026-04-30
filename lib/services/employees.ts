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
  await db.allowlist.upsert({
    where: { email: data.email },
    update: {},
    create: { email: data.email },
  })
  try {
    return await db.employee.create({ data })
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
  let imported = 0

  for (const row of rows) {
    if (!row.name || !row.email) {
      errors.push(`Row missing name or email: ${JSON.stringify(row)}`)
      continue
    }

    let managerId: string | null = null
    if (row.manager_email) {
      const manager = await db.employee.findUnique({ where: { email: row.manager_email } })
      if (!manager) {
        errors.push(`Manager not found for ${row.email}: ${row.manager_email}`)
        continue
      }
      managerId = manager.id
    }

    await db.allowlist.upsert({ where: { email: row.email }, update: {}, create: { email: row.email } })
    await db.employee.upsert({
      where: { email: row.email },
      update: { name: row.name, department: row.department, role: row.role, managerId },
      create: { name: row.name, email: row.email, department: row.department, role: row.role, managerId },
    })
    imported++
  }

  return { imported, errors }
}

export async function updateEmployeeManager(id: string, managerId: string | null) {
  return db.employee.update({ where: { id }, data: { managerId } })
}
