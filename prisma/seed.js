const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Clean existing records to avoid duplicates
  console.log("🧹 Cleaning existing data...");
  await prisma.notification.deleteMany({});
  await prisma.renderVersion.deleteMany({});
  await prisma.renderItem.deleteMany({});
  await prisma.ProjectEmployee.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const passwordHash = await bcrypt.hash("admin123", 10);

  // 3. Create Users
  console.log("👤 Creating Users...");
  const admin = await prisma.user.create({
    data: {
      id: "admin-user-id",
      name: "Admin User",
      email: "admin@3dflow.com",
      password_hash: passwordHash,
      role: "ADMIN",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80"
    }
  });

  const employee = await prisma.user.create({
    data: {
      id: "employee-user-id",
      name: "Arjun Sharma",
      email: "user@3dflow.com",
      password_hash: passwordHash,
      role: "EMPLOYEE",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80"
    }
  });

  const clientUser = await prisma.user.create({
    data: {
      id: "client-user-id",
      name: "Sarah Connor",
      email: "client@3dflow.com",
      password_hash: passwordHash,
      role: "EMPLOYEE", // fallback role for schema
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80"
    }
  });

  // 4. Create Clients
  console.log("🏢 Creating Clients...");
  const client = await prisma.client.create({
    data: {
      id: "cyberdyne-client-id",
      name: "Cyberdyne Systems",
      contact_person: "Sarah Connor",
      email: "client@3dflow.com",
      phone: "+1-555-0199",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80",
      public_link_token: "cyberdyne-token-2026",
      is_active: true,
      created_by_id: admin.id
    }
  });

  // 5. Create Projects
  console.log("📂 Creating Projects...");
  const project = await prisma.project.create({
    data: {
      id: "t800-project-id",
      name: "T-800 Endoskeleton Renders",
      description: "Complete catalog renders of the chassis, skull, and joint actuators for version 1.0.",
      total_render_count: 3,
      deadline: new Date("2026-08-29T18:30:00.000Z"),
      is_active: true,
      client_id: client.id,
      created_by_id: admin.id
    }
  });

  // 6. Assign Employee to Project
  console.log("🔗 Assigning Employee to Project...");
  await prisma.projectEmployee.create({
    data: {
      project_id: project.id,
      employee_id: employee.id
    }
  });

  // 7. Create Render Items and Versions
  console.log("🎬 Creating Render Items...");
  const renderItem1 = await prisma.renderItem.create({
    data: {
      id: "render-item-1-id",
      name: "Chassis Profile View",
      sku_code: "T800-CHAS-01",
      current_version: 2,
      current_status: "CLIENT_PENDING",
      project_id: project.id,
      created_by_id: employee.id
    }
  });

  await prisma.renderVersion.createMany({
    data: [
      {
        id: "version-1a-id",
        version_number: 1,
        file_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
        file_type: "IMAGE",
        admin_action: "APPROVED",
        admin_reviewed_at: new Date("2026-05-18T05:00:00.000Z"),
        client_action: "REJECTED",
        client_feedback: "The metallic sheen is too bright under key light. Darken the alloy grade.",
        client_reviewed_at: new Date("2026-05-18T06:00:00.000Z"),
        is_current_version: false,
        render_item_id: renderItem1.id,
        submitted_by_id: employee.id
      },
      {
        id: "version-1b-id",
        version_number: 2,
        file_url: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80",
        file_type: "IMAGE",
        admin_action: "APPROVED",
        admin_reviewed_at: new Date("2026-05-18T07:15:00.000Z"),
        is_current_version: true,
        render_item_id: renderItem1.id,
        submitted_by_id: employee.id
      }
    ]
  });

  const renderItem2 = await prisma.renderItem.create({
    data: {
      id: "render-item-2-id",
      name: "Skull Angle 3",
      sku_code: "T800-SKUL-03",
      current_version: 1,
      current_status: "SUBMITTED",
      project_id: project.id,
      created_by_id: employee.id
    }
  });

  await prisma.renderVersion.create({
    data: {
      id: "version-2a-id",
      version_number: 1,
      file_url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80",
      file_type: "IMAGE",
      is_current_version: true,
      render_item_id: renderItem2.id,
      submitted_by_id: employee.id
    }
  });

  const renderItem3 = await prisma.renderItem.create({
    data: {
      id: "render-item-3-id",
      name: "Left Leg View",
      sku_code: "T800-LLEG-02",
      current_version: 1,
      current_status: "COMPLETE",
      project_id: project.id,
      created_by_id: employee.id
    }
  });

  await prisma.renderVersion.create({
    data: {
      id: "version-3a-id",
      version_number: 1,
      file_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
      file_type: "IMAGE",
      admin_action: "APPROVED",
      admin_reviewed_at: new Date("2026-05-18T04:00:00.000Z"),
      client_action: "APPROVED",
      client_reviewed_at: new Date("2026-05-18T04:30:00.000Z"),
      is_current_version: true,
      render_item_id: renderItem3.id,
      submitted_by_id: employee.id
    }
  });

  console.log("🎉 Database Successfully Seeded!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
