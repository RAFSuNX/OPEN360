import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  const employee = await db.employee.findUnique({ where: { email: session.user.email } })
  if (!employee) {
    return (
      <div className="text-gray-500 text-sm">
        Your profile is not set up yet. Contact your admin.
      </div>
    )
  }

  const [pending, closedCycles] = await Promise.all([
    db.reviewAssignment.findMany({
      where: { reviewerId: employee.id, submitted: false, cycle: { status: 'ACTIVE' } },
      include: {
        reviewee: { select: { name: true } },
        cycle: { select: { title: true, endDate: true } },
      },
    }),
    db.reviewCycle.findMany({
      where: {
        status: 'CLOSED',
        assignments: { some: { revieweeId: employee.id } },
      },
      orderBy: { endDate: 'desc' },
    }),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Pending Reviews ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">No pending reviews.</p>
        ) : (
          <div className="space-y-2">
            {pending.map(a => (
              <Link key={a.id} href={`/dashboard/review/${a.id}`}
                className="block bg-white border rounded-lg p-4 hover:bg-blue-50 transition">
                <p className="font-medium">Review for {a.reviewee.name}</p>
                <p className="text-sm text-gray-500">
                  {a.cycle.title} - due {new Date(a.cycle.endDate).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My Results</h2>
        {closedCycles.length === 0 ? (
          <p className="text-gray-400 text-sm">No completed cycles yet.</p>
        ) : (
          <div className="space-y-2">
            {closedCycles.map(c => (
              <Link key={c.id} href={`/dashboard/results/${c.id}`}
                className="block bg-white border rounded-lg p-4 hover:bg-blue-50 transition">
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-gray-500">Closed {new Date(c.endDate).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
