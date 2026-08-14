import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { importEmployeesFromCsv, CsvRow } from '@/lib/services/employees'
import { parse } from 'csv-parse/sync'

export async function POST(req: NextRequest) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 413 })
  }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json({ error: 'Only .csv files are accepted.' }, { status: 415 })
  }

  const text = await file.text()
  const rows: CsvRow[] = parse(text, { columns: true, skip_empty_lines: true, trim: true })
  const result = await importEmployeesFromCsv(orgId, rows)
  const status = result.imported === 0 && result.errors.length > 0 ? 422 : 200
  return NextResponse.json(result, { status })
}
