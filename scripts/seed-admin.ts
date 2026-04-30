import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.FIRST_ADMIN_EMAIL
  if (!email) {
    throw new Error('FIRST_ADMIN_EMAIL environment variable is required')
  }

  await prisma.allowlist.upsert({
    where: { email },
    update: {},
    create: { email },
  })

  await prisma.employee.upsert({
    where: { email },
    update: { isAdmin: true },
    create: {
      name: 'Admin',
      email,
      isAdmin: true,
    },
  })

  console.log(`Admin bootstrapped: ${email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
