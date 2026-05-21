import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE"
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        avatar_url: true,
        _count: {
          select: {
            assignedProjects: true,
            createdRenderItems: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedEmployees = employees.map((emp) => {
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        projectsAssigned: emp._count.assignedProjects,
        activeRenders: emp._count.createdRenderItems,
        joinedDate: emp.createdAt.toISOString().split("T")[0],
        avatarUrl: emp.avatar_url || ""
      };
    });

    return NextResponse.json(mappedEmployees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, avatarUrl } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: "EMPLOYEE",
        avatar_url: avatarUrl || null
      }
    });

    return NextResponse.json({
      id: newEmployee.id,
      name: newEmployee.name,
      email: newEmployee.email,
      projectsAssigned: 0,
      activeRenders: 0,
      joinedDate: newEmployee.createdAt.toISOString().split("T")[0],
      avatarUrl: newEmployee.avatar_url || ""
    });
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
