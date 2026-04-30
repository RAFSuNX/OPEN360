import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">OPEN360</span>
        {session.user.isAdmin && (
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">Admin Panel</Link>
        )}
        <span className="text-sm text-gray-500">{session.user.email}</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
