import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma as destPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Simple query-param security to prevent accidental or unauthorized triggers
  if (secret !== "Flow2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let outgoingIp = "unknown";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (ipRes.ok) {
      const ipJson = await ipRes.json();
      outgoingIp = ipJson.ip;
    }
  } catch (ipErr) {
    // Ignore
  }

  // Connect to the OLD remote source database
  const sourcePrisma = new PrismaClient({
    datasourceUrl: "mysql://starlitc_trimpex_flow:Flow!%402026@96.127.186.146:3306/starlitc_trimpex_flow"
  });

  const results: Record<string, number> = {};

  try {
    console.log("[MIGRATOR] Beginning database copy on production server...");

    // 1. Users
    const users = await sourcePrisma.user.findMany();
    if (users.length > 0) {
      await destPrisma.user.createMany({ data: users, skipDuplicates: true });
    }
    results.users = users.length;

    // 2. Clients
    const clients = await sourcePrisma.client.findMany();
    if (clients.length > 0) {
      await destPrisma.client.createMany({ data: clients, skipDuplicates: true });
    }
    results.clients = clients.length;

    // 3. Projects
    const projects = await sourcePrisma.project.findMany();
    if (projects.length > 0) {
      await destPrisma.project.createMany({ data: projects, skipDuplicates: true });
    }
    results.projects = projects.length;

    // 4. ProjectEmployees
    const projectEmployees = await sourcePrisma.projectEmployee.findMany();
    if (projectEmployees.length > 0) {
      await destPrisma.projectEmployee.createMany({ data: projectEmployees, skipDuplicates: true });
    }
    results.projectEmployees = projectEmployees.length;

    // 5. RenderItems
    const renderItems = await sourcePrisma.renderItem.findMany();
    if (renderItems.length > 0) {
      await destPrisma.renderItem.createMany({ data: renderItems, skipDuplicates: true });
    }
    results.renderItems = renderItems.length;

    // 6. RenderVersions
    const renderVersions = await sourcePrisma.renderVersion.findMany();
    if (renderVersions.length > 0) {
      await destPrisma.renderVersion.createMany({ data: renderVersions, skipDuplicates: true });
    }
    results.renderVersions = renderVersions.length;

    // 7. Notifications
    const notifications = await sourcePrisma.notification.findMany();
    if (notifications.length > 0) {
      await destPrisma.notification.createMany({ data: notifications, skipDuplicates: true });
    }
    results.notifications = notifications.length;

    console.log("[MIGRATOR] Database copy finished successfully:", results);

    return NextResponse.json({
      success: true,
      outgoingIp,
      message: "Database migration successful on production",
      migrated: results
    });
  } catch (error: any) {
    console.error("[MIGRATOR] Migration failed:", error);
    return NextResponse.json({
      success: false,
      outgoingIp,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    await sourcePrisma.$disconnect();
  }
}
