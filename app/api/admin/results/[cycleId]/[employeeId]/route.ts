import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { buildResults } from '@/lib/services/results'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cycleId: string; employeeId: string }> }
) {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId } = auth

  const { cycleId, employeeId } = await params
  const results = await buildResults(orgId, cycleId, employeeId, true)
  return NextResponse.json(results)
}
