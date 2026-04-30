import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">OPEN360 Admin</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/admin/employees" className="hover:text-black">Employees</Link>
          <Link href="/admin/cycles" className="hover:text-black">Cycles</Link>
          <Link href="/admin/questions" className="hover:text-black">Questions</Link>
        </div>
        <span className="text-sm text-gray-500">{session.user.email}</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
