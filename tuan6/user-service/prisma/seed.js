require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'admin', password: 'password', role: 'ADMIN' },
    { username: 'user1', password: 'password', role: 'USER' }
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { username: u.username } });
    if (!exists) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          username: u.username,
          passwordHash,
          role: u.role
        }
      });
    }
  }

  console.log('User seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
