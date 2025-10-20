const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    // CHANGE the envelopeId if you want to target a different one
    const envelopeId = process.env.ENVELOPE_ID || 'cmgtju1g70000uucgk0jlyqt7';
    const amount = Number(process.env.AMOUNT || 1200);
    const now = new Date();

    const tx = await prisma.transaction.create({ data: { kind: 'OUT', label: 'Test dépense UI', amount: amount, at: now } });
    console.log('Created transaction', tx.id);

    const alloc = await prisma.transactionAllocation.create({ data: { transactionId: tx.id, envelopeId, amount } });
    console.log('Created allocation', alloc.id);

    const spent = await prisma.transactionAllocation.aggregate({ _sum: { amount: true }, where: { envelopeId } });
    console.log('Current spent on envelope:', spent._sum.amount || 0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();



