const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const envs = await prisma.envelope.findMany();
    console.log('ENVELOPES');
    console.log(JSON.stringify(envs, null, 2));
    const txs = await prisma.transaction.findMany();
    console.log('\nTRANSACTIONS');
    console.log(JSON.stringify(txs, null, 2));
    const allocs = await prisma.transactionAllocation.findMany();
    console.log('\nALLOCATIONS');
    console.log(JSON.stringify(allocs, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();



