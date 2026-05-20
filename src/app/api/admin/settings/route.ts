import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // Fallback: If no session, find the first admin
    if (!userId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      userId = adminUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "No admin user found" }, { status: 404 });
    }

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
      }
    });
  } catch (error) {
    console.error("Failed to fetch settings data:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // Fallback: If no session, update the first admin
    if (!userId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      userId = adminUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "No admin user found to update" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, password, avatarUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const dataToUpdate: any = {
      name,
      email,
      avatar_url: avatarUrl || null,
    };

    if (password) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      }
    });

    return NextResponse.json({
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      avatarUrl: updatedAdmin.avatar_url || "",
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
