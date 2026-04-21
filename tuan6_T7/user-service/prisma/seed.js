const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...');
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      username: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'System Admin',
      role: 'ADMIN'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'alice@example.com',
      passwordHash: await bcrypt.hash('123456', 10),
      name: 'Alice',
      role: 'USER'
    }
  });

  console.log('Seed users:', { admin, user1 });
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
