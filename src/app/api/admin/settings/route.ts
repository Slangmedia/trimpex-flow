import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      }
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Fetch system stats
    const [clientsCount, projectsCount, employeesCount, rendersCount] = await Promise.all([
      prisma.client.count(),
      prisma.project.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.renderItem.count(),
    ]);

    // Fetch or create branding settings
    let branding = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!branding) {
      branding = await prisma.systemSettings.create({
        data: {
          id: "default",
          companyName: "3DFlow",
          supportEmail: "support@3dflow.com",
          accentColor: "indigo",
          logoUrl: null,
          copyrightText: "© 2026 3DFlow. All rights reserved."
        }
      });
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        avatarUrl: admin.avatar_url || "",
      },
      stats: {
        clients: clientsCount,
        projects: projectsCount,
        employees: employeesCount,
        renders: rendersCount,
      },
      branding
    });
  } catch (error) {
    console.error("Failed to fetch settings data:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { name, email, password, avatarUrl, branding } = body;

    let updatedAdmin = null;
    let updatedBranding = null;

    // Update Admin profile if provided
    if (name || email || password || avatarUrl !== undefined) {
      if ((name && !email) || (!name && email)) {
        // if one is provided, check existence or require both
        if (!name || !email) {
          return NextResponse.json({ error: "Name and email are required for profile updates" }, { status: 400 });
        }
      }

      const dataToUpdate: any = {};
      if (name) dataToUpdate.name = name;
      if (email) dataToUpdate.email = email;
      if (avatarUrl !== undefined) dataToUpdate.avatar_url = avatarUrl || null;
      if (password) {
        dataToUpdate.password_hash = await bcrypt.hash(password, 10);
      }

      updatedAdmin = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
        }
      });
    }

    // Update Branding settings if provided
    if (branding) {
      const { companyName, supportEmail, accentColor, logoUrl, copyrightText } = branding;

      updatedBranding = await prisma.systemSettings.upsert({
        where: { id: "default" },
        update: {
          companyName,
          supportEmail,
          accentColor,
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
          copyrightText
        },
        create: {
          id: "default",
          companyName: companyName || "3DFlow",
          supportEmail: supportEmail || "support@3dflow.com",
          accentColor: accentColor || "indigo",
          logoUrl: logoUrl || null,
          copyrightText: copyrightText || "© 2026 3DFlow. All rights reserved."
        }
      });
    }

    return NextResponse.json({
      success: true,
      admin: updatedAdmin ? {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        avatarUrl: updatedAdmin.avatar_url || "",
      } : undefined,
      branding: updatedBranding || undefined
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
