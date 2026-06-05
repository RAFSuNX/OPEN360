import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.FIRST_ADMIN_EMAIL
  const orgSlug = process.env.FIRST_ORG_SLUG ?? 'default'
  const orgName = process.env.FIRST_ORG_NAME ?? 'My Organization'

  if (!email) throw new Error('FIRST_ADMIN_EMAIL environment variable is required')

  // Find or create org
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { name: orgName, slug: orgSlug },
  })

  // Add to allowlist
  await prisma.allowlist.upsert({
    where: { orgId_email: { orgId: org.id, email } },
    update: {},
    create: { orgId: org.id, email },
  })

  // Create or update admin employee
  await prisma.employee.upsert({
    where: { orgId_email: { orgId: org.id, email } },
    update: { isAdmin: true },
    create: { orgId: org.id, name: email.split('@')[0], email, isAdmin: true },
  })

  console.log(`Admin bootstrapped: ${email} in org "${org.name}" (${org.slug})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
