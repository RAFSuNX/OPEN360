import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth'; import { redirect } from 'next/navigation';
export default async function P() { const s = await getServerSession(authOptions); redirect(`/org/${s?.user?.orgSlug ?? ''}/admin/employees`) }
