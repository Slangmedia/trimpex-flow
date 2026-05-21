import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      avatarUrl: employee.avatar_url || "",
    });
  } catch (error) {
    console.error("Failed to fetch employee profile:", error);
    return NextResponse.json({ error: "Failed to fetch employee profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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

    const updatedEmployee = await prisma.user.update({
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
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      avatarUrl: updatedEmployee.avatar_url || "",
    });
  } catch (error) {
    console.error("Failed to update employee profile:", error);
    return NextResponse.json({ error: "Failed to update employee profile" }, { status: 500 });
  }
}
