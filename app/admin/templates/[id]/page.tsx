import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function P({ params }: { params: Promise<{ id: string }> }) {
  const [s, { id }] = await Promise.all([getServerSession(authOptions), params])
  redirect(`/org/${s?.user?.orgSlug ?? ''}/admin/templates/${id}`)
}
