import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { importEmployeesFromCsv, CsvRow } from '@/lib/services/employees'
import { parse } from 'csv-parse/sync'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  const rows: CsvRow[] = parse(text, { columns: true, skip_empty_lines: true })
  const result = await importEmployeesFromCsv(rows)
  const status = result.imported === 0 && result.errors.length > 0 ? 422 : 200
  return NextResponse.json(result, { status })
}
