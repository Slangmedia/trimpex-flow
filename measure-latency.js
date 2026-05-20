const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Measuring database connection & query times...");
  
  const start = Date.now();
  await prisma.$connect();
  console.log(`Connection established in: ${Date.now() - start}ms`);
  
  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now();
    await prisma.user.findFirst();
    console.log(`Query ${i} took: ${Date.now() - t0}ms`);
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
