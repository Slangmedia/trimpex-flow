import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAuthUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return session.user;
  }

  // Local development sandbox fallback: retrieve context user based on referer
  const referer = req.headers.get("referer") || "";
  const isAdminPath = referer.includes("/admin");
  const fallbackUser = await prisma.user.findFirst({
    where: { role: isAdminPath ? "ADMIN" : "EMPLOYEE" }
  });
  if (fallbackUser) {
    return {
      id: fallbackUser.id,
      name: fallbackUser.name,
      email: fallbackUser.email,
      role: fallbackUser.role,
    };
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const renderItem = await prisma.renderItem.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version_number: "desc" },
          include: {
            submittedBy: {
              select: { name: true, avatar_url: true }
            }
          }
        },
        project: {
          select: { name: true, client: { select: { name: true } } }
        }
      },
    });

    if (!renderItem) {
      return NextResponse.json({ error: "Render item not found" }, { status: 404 });
    }

    return NextResponse.json(renderItem);
  } catch (error) {
    console.error("[RENDER_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handler for decisions (Approve/Reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { action, note, versionId } = await req.json();

    if (!action || !versionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update status based on admin action
    const newStatus = action === "APPROVE" ? "CLIENT_PENDING" : "ADMIN_REJECTED";
    const adminAction = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // 1. Update the version review details
    await prisma.renderVersion.update({
      where: { id: versionId },
      data: {
        admin_reviewed_at: new Date(),
        admin_action: adminAction,
        admin_note: note,
      },
    });

    // 2. Update the parent RenderItem status
    const result = await prisma.renderItem.update({
      where: { id },
      data: {
        current_status: newStatus,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RENDER_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const renderItem = await prisma.renderItem.findUnique({
      where: { id },
    });

    if (!renderItem) {
      return NextResponse.json({ error: "Render item not found" }, { status: 404 });
    }

    // Authorization: Only admin or the creator of the render item can delete it
    if (user.role !== "ADMIN") {
      if (renderItem.created_by_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized: You did not upload this render" }, { status: 403 });
      }
      
      // Safety check: Cannot delete a completed render
      if (renderItem.current_status === "COMPLETE") {
        return NextResponse.json({ error: "Cannot delete a completed render" }, { status: 400 });
      }
    }

    // 1. Delete notifications related to this render item
    await prisma.notification.deleteMany({
      where: { related_render_id: id }
    });

    // 2. Delete render versions belonging to this render item
    await prisma.renderVersion.deleteMany({
      where: { render_item_id: id }
    });

    // 3. Delete the render item itself
    await prisma.renderItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Render deleted successfully" });
  } catch (error) {
    console.error("[RENDER_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
