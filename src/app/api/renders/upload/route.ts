import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { renderItemId, fileUrl, fileType } = await req.json();

    if (!renderItemId || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check parent RenderItem status
    const renderItem = await prisma.renderItem.findUnique({
      where: { id: renderItemId },
      include: {
        project: true
      }
    });

    if (!renderItem) {
      return NextResponse.json({ error: "Render item not found" }, { status: 404 });
    }

    if (renderItem.current_status === "ADMIN_REJECTED" || renderItem.current_status === "REJECTED") {
      return NextResponse.json(
        { error: "This item has been rejected and cannot be resubmitted." },
        { status: 400 }
      );
    }

    // 2. Get the current version count for this item
    const versionCount = await prisma.renderVersion.count({
      where: { render_item_id: renderItemId },
    });

    const nextVersionNumber = versionCount + 1;

    // 2. Set all existing versions to not current
    await prisma.renderVersion.updateMany({
      where: { 
        render_item_id: renderItemId,
        is_current_version: true 
      },
      data: { is_current_version: false },
    });

    // 3. Create the new RenderVersion
    const newVersion = await prisma.renderVersion.create({
      data: {
        version_number: nextVersionNumber,
        file_url: fileUrl,
        file_type: fileType, // IMAGE or VIDEO
        is_current_version: true,
        render_item_id: renderItemId,
        submitted_by_id: userId,
      },
    });

    // 4. Update the parent RenderItem
    const updatedItem = await prisma.renderItem.update({
      where: { id: renderItemId },
      data: {
        current_version: nextVersionNumber,
        current_status: "SUBMITTED",
      },
    });

    // 5. Notify the project admin
    if (renderItem?.project?.created_by_id) {
      try {
        await prisma.notification.create({
          data: {
            type: "RENDER_SUBMITTED",
            message: `${session.user.name || "Employee"} submitted "${renderItem.name}" (V${nextVersionNumber})`,
            user_id: renderItem.project.created_by_id,
            related_render_id: renderItemId,
            related_project_id: renderItem.project_id
          }
        });
      } catch (e) {
        console.error("Failed to create notification on render upload:", e);
      }
    }

    return NextResponse.json({
      message: "Render version created successfully",
      data: { newVersion, updatedItem },
    });
  } catch (error: any) {
    console.error("[RENDER_UPLOAD_ERROR]", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
