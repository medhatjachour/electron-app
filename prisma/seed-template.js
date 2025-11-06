const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  try {
    const count = await prisma.user.count()
    if (count > 0) {
      console.log('Template DB already seeded - skipping')
      return
    }

    const hash = await bcrypt.hash('0000', 10)
    const user = await prisma.user.create({ data: { username: '0000', passwordHash: hash, role: 'admin' } })
    console.log('Created admin user in template DB:', user.username)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
