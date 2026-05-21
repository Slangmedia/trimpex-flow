import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      avatarUrl: employee.avatar_url || ""
    });
  } catch (error) {
    console.error("Failed to fetch employee details:", error);
    return NextResponse.json({ error: "Failed to fetch employee details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, password, avatarUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

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
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      avatarUrl: updatedEmployee.avatar_url || ""
    });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // 1. Delete notifications related to employee
    await prisma.notification.deleteMany({
      where: { user_id: id }
    });

    // 2. Delete project assignments
    await prisma.projectEmployee.deleteMany({
      where: { employee_id: id }
    });

    // 3. Delete render versions and items submitted/created by employee
    const versions = await prisma.renderVersion.findMany({
      where: { submitted_by_id: id }
    });
    const versionIds = versions.map(v => v.id);

    if (versionIds.length > 0) {
      await prisma.renderVersion.deleteMany({
        where: { id: { in: versionIds } }
      });
    }

    const renderItems = await prisma.renderItem.findMany({
      where: { created_by_id: id }
    });
    const renderItemIds = renderItems.map(ri => ri.id);

    if (renderItemIds.length > 0) {
      await prisma.renderVersion.deleteMany({
        where: { render_item_id: { in: renderItemIds } }
      });

      await prisma.renderItem.deleteMany({
        where: { id: { in: renderItemIds } }
      });
    }

    // 4. Delete the user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
