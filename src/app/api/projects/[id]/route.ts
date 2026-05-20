import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        renderItems: {
          include: {
            versions: {
              orderBy: { version_number: "desc" }
            },
            createdBy: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const mappedItems = project.renderItems.map((item) => {
      const currentVersion = item.versions.find(v => v.is_current_version) || item.versions[0];
      return {
        id: item.id,
        name: item.name,
        skuCode: item.sku_code,
        currentVersion: item.current_version,
        currentStatus: item.current_status,
        submittedBy: item.createdBy?.name || "Unknown",
        submittedAt: item.createdAt.toLocaleDateString(),
        imageUrl: currentVersion?.file_url || "",
        clientFeedback: currentVersion?.client_feedback || "",
        adminNote: currentVersion?.admin_note || "",
        currentVersionId: currentVersion?.id || "",
        versionsHistory: item.versions.map((v) => ({
          id: v.id,
          versionNumber: v.version_number,
          fileUrl: v.file_url,
          fileType: v.file_type,
          submittedAt: v.submitted_at.toLocaleDateString(),
          adminAction: v.admin_action,
          adminNote: v.admin_note,
          clientAction: v.client_action,
          clientFeedback: v.client_feedback
        }))
      };
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      clientName: project.client.name,
      deadline: project.deadline.toISOString().split("T")[0],
      totalRenders: project.total_render_count,
      renderItems: mappedItems
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Delete notifications related to project
    await prisma.notification.deleteMany({
      where: { related_project_id: id }
    });

    // 2. Delete project assignments
    await prisma.projectEmployee.deleteMany({
      where: { project_id: id }
    });

    // 3. Find and delete render items and their versions
    const renderItems = await prisma.renderItem.findMany({
      where: { project_id: id }
    });
    const renderItemIds = renderItems.map(ri => ri.id);

    if (renderItemIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { related_render_id: { in: renderItemIds } }
      });

      await prisma.renderVersion.deleteMany({
        where: { render_item_id: { in: renderItemIds } }
      });

      await prisma.renderItem.deleteMany({
        where: { project_id: id }
      });
    }

    // 4. Delete the project itself
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
