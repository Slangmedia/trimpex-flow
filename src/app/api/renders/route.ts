import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, skuCode, projectId, fileUrl, fileType } = body;

    if (!name || !projectId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: name, projectId, and fileUrl are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const mappedFileType = fileType === "VIDEO" ? "VIDEO" : "IMAGE";

    // 1. Create RenderItem
    const newRenderItem = await prisma.renderItem.create({
      data: {
        name,
        sku_code: skuCode || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        current_version: 1,
        current_status: "SUBMITTED",
        project_id: projectId,
        created_by_id: userId,
      },
    });

    // 2. Create RenderVersion V1
    await prisma.renderVersion.create({
      data: {
        version_number: 1,
        file_url: fileUrl,
        file_type: mappedFileType,
        is_current_version: true,
        render_item_id: newRenderItem.id,
        submitted_by_id: userId,
      },
    });

    // Fetch the complete created item with relations to return
    const completeItem = await prisma.renderItem.findUnique({
      where: { id: newRenderItem.id },
      include: {
        versions: {
          where: { is_current_version: true },
          select: { 
            id: true,
            file_url: true,
            client_feedback: true,
            admin_note: true
          }
        },
        createdBy: { select: { name: true } }
      }
    });

    if (!completeItem) {
      return NextResponse.json({ error: "Failed to fetch created render item" }, { status: 500 });
    }

    const mappedItem = {
      id: completeItem.id,
      name: completeItem.name,
      skuCode: completeItem.sku_code,
      currentVersion: completeItem.current_version,
      currentStatus: completeItem.current_status,
      createdById: completeItem.created_by_id,
      submittedBy: completeItem.createdBy?.name || "Unknown",
      submittedAt: completeItem.createdAt.toLocaleDateString(),
      imageUrl: completeItem.versions[0]?.file_url || "",
      clientFeedback: completeItem.versions[0]?.client_feedback || "",
      adminNote: completeItem.versions[0]?.admin_note || "",
      currentVersionId: completeItem.versions[0]?.id || ""
    };

    return NextResponse.json(mappedItem);
  } catch (error) {
    console.error("[RENDER_ITEM_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
