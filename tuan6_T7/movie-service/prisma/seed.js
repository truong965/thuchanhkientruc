const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const m1 = await prisma.movie.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Avengers: Endgame',
      description: 'Superheroes assemble to fight Thanos',
      price: 15.0,
      availableSeats: 100,
    },
  })
  const m2 = await prisma.movie.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'Spider-Man: No Way Home',
      description: 'Peter Parker deals with the multiverse',
      price: 12.0,
      availableSeats: 80,
    },
  })

  console.log('Seed movies:', { m1, m2 })

  // Reset sequence cho Postgres sau khi chèn cứng ID
  await prisma.$executeRawUnsafe(`SELECT setval('"Movie_id_seq"', (SELECT MAX(id) FROM "Movie"))`);
  console.log('Sequence reset for Movie table');
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
