import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
