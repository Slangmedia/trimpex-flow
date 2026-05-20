const { PrismaClient } = require('@prisma/client');

// Connect to the OLD database (source - now the copy on Hostinger)
const sourcePrisma = new PrismaClient({
  datasourceUrl: "mysql://u650091516_flow_trimpex:Flow!%402026@193.203.184.52:3306/u650091516_flow_trimpex"
});

// Connect to the NEW database (destination)
const destPrisma = new PrismaClient({
  datasourceUrl: "mysql://starlitc_flow_user:Flow%21%402025@96.127.186.146:3306/starlitc_flow"
});

async function migrate() {
  console.log("Starting data migration...");

  // We must migrate in topological order to satisfy foreign key constraints
  
  // 1. Users
  const users = await sourcePrisma.user.findMany();
  if (users.length > 0) await destPrisma.user.createMany({ data: users, skipDuplicates: true });
  console.log(`Migrated ${users.length} users.`);

  // 2. Clients
  const clients = await sourcePrisma.client.findMany();
  if (clients.length > 0) await destPrisma.client.createMany({ data: clients, skipDuplicates: true });
  console.log(`Migrated ${clients.length} clients.`);

  // 3. Projects
  const projects = await sourcePrisma.project.findMany();
  if (projects.length > 0) await destPrisma.project.createMany({ data: projects, skipDuplicates: true });
  console.log(`Migrated ${projects.length} projects.`);

  // 4. ProjectEmployees
  const projectEmployees = await sourcePrisma.projectEmployee.findMany();
  if (projectEmployees.length > 0) await destPrisma.projectEmployee.createMany({ data: projectEmployees, skipDuplicates: true });
  console.log(`Migrated ${projectEmployees.length} project assignments.`);

  // 5. RenderItems
  const renderItems = await sourcePrisma.renderItem.findMany();
  if (renderItems.length > 0) await destPrisma.renderItem.createMany({ data: renderItems, skipDuplicates: true });
  console.log(`Migrated ${renderItems.length} render items.`);

  // 6. RenderVersions
  const renderVersions = await sourcePrisma.renderVersion.findMany();
  if (renderVersions.length > 0) await destPrisma.renderVersion.createMany({ data: renderVersions, skipDuplicates: true });
  console.log(`Migrated ${renderVersions.length} render versions.`);

  // 7. Notifications
  const notifications = await sourcePrisma.notification.findMany();
  if (notifications.length > 0) await destPrisma.notification.createMany({ data: notifications, skipDuplicates: true });
  console.log(`Migrated ${notifications.length} notifications.`);

  console.log("Migration complete!");
}

migrate()
  .catch(e => { console.error("Migration Failed:", e); process.exit(1); })
  .finally(async () => {
    await sourcePrisma.$disconnect();
    await destPrisma.$disconnect();
  });
