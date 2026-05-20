import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendingVersions = await prisma.renderVersion.findMany({
      where: {
        admin_action: null,
        is_current_version: true
      },
      include: {
        submittedBy: true,
        renderItem: {
          include: {
            project: {
              include: {
                client: true
              }
            }
          }
        }
      },
      orderBy: {
        submitted_at: "desc"
      }
    });

    const mappedQueue = pendingVersions.map((version) => {
      // Calculate relative time friendly format
      const diffMs = Date.now() - new Date(version.submitted_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let submittedTime = "Just now";
      if (diffDays > 0) {
        submittedTime = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        submittedTime = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMins > 0) {
        submittedTime = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      }

      return {
        id: version.id,
        renderItemId: version.render_item_id,
        clientName: version.renderItem.project.client.name,
        projectName: version.renderItem.project.name,
        renderName: version.renderItem.name,
        sku: version.renderItem.sku_code,
        version: version.version_number,
        employee: version.submittedBy.name,
        submittedTime,
        fileUrl: version.file_url,
        fileType: version.file_type
      };
    });

    return NextResponse.json(mappedQueue);
  } catch (error) {
    console.error("Failed to fetch approval queue:", error);
    return NextResponse.json({ error: "Failed to fetch approval queue" }, { status: 500 });
  }
}
