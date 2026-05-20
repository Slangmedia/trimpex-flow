const { PrismaClient } = require('@prisma/client');

async function testConnection(name, url) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    console.log(`Connecting to ${name} database...`);
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const projects = await prisma.project.count();
    const renderItems = await prisma.renderItem.count();
    const renderVersions = await prisma.renderVersion.count();
    const notifications = await prisma.notification.count();
    const assignments = await prisma.projectEmployee.count();

    console.log(`\n=== ${name} Database Counts ===`);
    console.log(`Users: ${users}`);
    console.log(`Clients: ${clients}`);
    console.log(`Projects: ${projects}`);
    console.log(`Project Assignments: ${assignments}`);
    console.log(`Render Items: ${renderItems}`);
    console.log(`Render Versions: ${renderVersions}`);
    console.log(`Notifications: ${notifications}`);
    console.log(`==================================\n`);
  } catch (error) {
    console.error(`Error connecting to ${name}:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const oldUrl = "mysql://starlitc_trimpex_flow:Flow!%402026@96.127.186.146:3306/starlitc_trimpex_flow";
  const newUrl = "mysql://u650091516_trimpex_flow:Flow!%402026@193.203.184.52:3306/u650091516_trimpex_flow";

  await testConnection("OLD DB (96.127.186.146)", oldUrl);
  await testConnection("NEW DB (193.203.184.52)", newUrl);
}

run();
