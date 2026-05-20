const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const projects = await prisma.project.findMany({ select: { id: true, name: true, client_id: true } });
  console.log("PROJECTS:", JSON.stringify(projects, null, 2));

  const assignments = await prisma.projectEmployee.findMany();
  console.log("ASSIGNMENTS:", JSON.stringify(assignments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
