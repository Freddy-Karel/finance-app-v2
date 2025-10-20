const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const envelopes = [
    { name: 'Courses', emoji: '🛒', protected: false, active: true },
    { name: 'Loyer', emoji: '🏠', protected: true, active: true },
    { name: 'Épargne', emoji: '💰', protected: false, active: true }
  ];
  for (const e of envelopes) {
    const found = await prisma.envelope.findFirst({ where: { name: e.name } });
    if (!found) await prisma.envelope.create({ data: e });
  }

  const services = [
    { name: 'Salaire', active: true },
    { name: 'Freelance', active: true }
  ];
  for (const s of services) {
    const found = await prisma.service.findFirst({ where: { name: s.name } });
    if (!found) await prisma.service.create({ data: s });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
