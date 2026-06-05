import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pending = await db.reviewAssignment.findMany({
    where: {
      reviewerId: session.user.id,
      submitted: false,
      cycle: { status: 'ACTIVE', orgId: session.user.orgId },
    },
    include: {
      reviewee: { select: { name: true } },
      cycle: { select: { title: true, endDate: true } },
    },
  })

  return NextResponse.json(pending)
}
