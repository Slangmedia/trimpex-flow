const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("USERS:", users);
  const pe = await prisma.projectEmployee.findMany();
  console.log("ASSIGNMENTS:", pe);
}
main().then(() => process.exit(0));
