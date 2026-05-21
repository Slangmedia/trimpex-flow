import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
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
    const { action, note } = body;

    if (!id) {
      return NextResponse.json({ error: "Version ID is required" }, { status: 400 });
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT" }, { status: 400 });
    }

    // 1. Fetch the version details
    const version = await prisma.renderVersion.findUnique({
      where: { id },
      include: {
        renderItem: {
          include: {
            project: {
              include: { client: true }
            }
          }
        }
      }
    });

    if (!version) {
      return NextResponse.json({ error: "Render version not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // 2a. Mark version as admin-approved
      await prisma.renderVersion.update({
        where: { id },
        data: {
          admin_action: "APPROVED",
          admin_reviewed_at: new Date()
        }
      });

      // 2b. Set render item status → CLIENT_PENDING (visible to client)
      await prisma.renderItem.update({
        where: { id: version.render_item_id },
        data: { current_status: "CLIENT_PENDING" }
      });

      // 2c. Notify employee
      await prisma.notification.create({
        data: {
          type: "ADMIN_APPROVED",
          message: `Your render "${version.renderItem.name}" (V${version.version_number}) has been approved and sent to the client.`,
          user_id: version.submitted_by_id,
          related_render_id: version.render_item_id,
          related_project_id: version.renderItem.project_id
        }
      });

      // 2d. Notify client portal
      await prisma.notification.create({
        data: {
          type: "RENDER_SUBMITTED",
          message: `A new render "${version.renderItem.name}" (V${version.version_number}) is ready for your review.`,
          client_token: version.renderItem.project.client.public_link_token,
          related_render_id: version.render_item_id,
          related_project_id: version.renderItem.project_id
        }
      });

    } else {
      // 3a. Mark version as admin-rejected with note
      await prisma.renderVersion.update({
        where: { id },
        data: {
          admin_action: "REJECTED",
          admin_reviewed_at: new Date(),
          admin_note: note || "No feedback provided."
        }
      });

      // 3b. Set render item status → ADMIN_REJECTED (hidden from client, visible to employee)
      await prisma.renderItem.update({
        where: { id: version.render_item_id },
        data: { current_status: "ADMIN_REJECTED" }
      });

      // 3c. Notify employee
      await prisma.notification.create({
        data: {
          type: "ADMIN_REJECTED",
          message: `Your render "${version.renderItem.name}" was rejected. Admin note: "${note || "No feedback provided."}"`,
          user_id: version.submitted_by_id,
          related_render_id: version.render_item_id,
          related_project_id: version.renderItem.project_id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Render version successfully ${action.toLowerCase()}d`
    });

  } catch (error: any) {
    console.error("Failed to process approval action:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || "Failed to process action" },
      { status: 500 }
    );
  }
}
