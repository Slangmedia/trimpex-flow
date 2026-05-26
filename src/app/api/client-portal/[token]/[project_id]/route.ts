import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { token: string; project_id: string } }
) {
  try {
    const { token, project_id } = params;

    if (!token || !project_id) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Fetch the specific project belonging to the client matching public link token
    const project = await prisma.project.findFirst({
      where: {
        id: project_id,
        client: {
          public_link_token: token
        }
      },
      include: {
        client: true,
        renderItems: {
          include: {
            versions: {
              orderBy: { version_number: "asc" }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project or Client not found" }, { status: 404 });
    }

    // 2. Map renders — only show items that have at least one admin-approved version.
    //    This ensures: if V2 is submitted but not yet approved, client still sees V1.
    const mappedRenders = project.renderItems
      .map((item) => {
        // Only show versions that were admin-approved to the client
        const approvedVersions = item.versions.filter(
          (v) => v.admin_action === "APPROVED"
        );

        // Skip entirely if no version has ever been approved
        if (approvedVersions.length === 0) return null;

        // The latest admin-approved version is what the client sees
        const latestApproved = approvedVersions[approvedVersions.length - 1];

        // Determine the display status:
        // If current_status is SUBMITTED, ADMIN_REJECTED or REVISION_REQUIRED,
        // show REVISION_PENDING so the client sees 'Revision Pending' on V1
        // and doesn't get action buttons.
        const isRevisionPending = ["SUBMITTED", "ADMIN_REJECTED", "REVISION_REQUIRED"].includes(item.current_status);
        const displayStatus = isRevisionPending ? "REVISION_PENDING" : item.current_status;

        return {
          id: item.id,
          name: item.name,
          sku: item.sku_code,
          version: latestApproved.version_number,
          status: displayStatus,
          thumbnail: latestApproved.file_url || "",
          fileType: latestApproved.file_type,
          clientFeedback: latestApproved.client_feedback || "",
          adminNote: latestApproved.admin_note || "",
          versionId: latestApproved.id,
          // Version history: only admin-approved versions shown
          versionsHistory: approvedVersions.map((v) => ({
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
      })
      .filter(Boolean); // remove nulls

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.client.name,
      },
      renders: mappedRenders
    });
  } catch (error) {
    console.error("Failed to load client project renders:", error);
    return NextResponse.json({ error: "Failed to load client project renders" }, { status: 500 });
  }
}


export async function PATCH(
  request: Request,
  { params }: { params: { token: string; project_id: string } }
) {
  try {
    const { token, project_id } = params;
    const { renderId, action, feedback } = await request.json();

    if (!token || !project_id || !renderId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if ((action === "REJECT" || action === "CHANGES") && (!feedback || feedback.trim().length < 10)) {
      return NextResponse.json(
        { error: "A feedback message of at least 10 characters is required for rejection or change requests." },
        { status: 400 }
      );
    }

    // 1. Verify client public link token
    const client = await prisma.client.findUnique({
      where: { public_link_token: token }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 2. Fetch the render item and its current version
    const renderItem = await prisma.renderItem.findUnique({
      where: { id: renderId },
      include: {
        project: true,
        versions: {
          where: { is_current_version: true }
        }
      }
    });

    if (!renderItem || renderItem.project_id !== project_id) {
      return NextResponse.json({ error: "Render item not found" }, { status: 404 });
    }

    const currentVersion = renderItem.versions[0];
    if (!currentVersion) {
      return NextResponse.json({ error: "Current version not found" }, { status: 404 });
    }

    // 3. Map action values to db enum values
    let newStatus: "COMPLETE" | "REJECTED" | "REVISION_REQUIRED";
    let clientAction: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

    if (action === "APPROVE") {
      newStatus = "COMPLETE";
      clientAction = "APPROVED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
      clientAction = "REJECTED";
    } else if (action === "CHANGES") {
      newStatus = "REVISION_REQUIRED";
      clientAction = "CHANGES_REQUESTED";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update version review details
    await prisma.renderVersion.update({
      where: { id: currentVersion.id },
      data: {
        client_reviewed_at: new Date(),
        client_action: clientAction,
        client_feedback: feedback || ""
      }
    });

    // Update parent RenderItem status
    const result = await prisma.renderItem.update({
      where: { id: renderId },
      data: {
        current_status: newStatus
      }
    });

    // Create notifications for Admin and Employee
    try {
      const actionName = action === "APPROVE" ? "approved" : action === "REJECT" ? "rejected" : "requested changes on";
      const notifType = clientAction === "APPROVED" ? "CLIENT_APPROVED" : clientAction === "REJECTED" ? "CLIENT_REJECTED" : "CLIENT_REQUESTED_CHANGES";

      // 1. Notify Admin
      if (renderItem.project?.created_by_id) {
        await prisma.notification.create({
          data: {
            type: notifType,
            message: `Client "${client.name}" ${actionName} "${renderItem.name}" (V${currentVersion.version_number})`,
            user_id: renderItem.project.created_by_id,
            related_render_id: renderId,
            related_project_id: project_id
          }
        });
      }

      // 2. Notify Employee who submitted the version
      if (currentVersion.submitted_by_id) {
        await prisma.notification.create({
          data: {
            type: notifType,
            message: `Client "${client.name}" ${actionName} your render "${renderItem.name}" (V${currentVersion.version_number})`,
            user_id: currentVersion.submitted_by_id,
            related_render_id: renderId,
            related_project_id: project_id
          }
        });
      }
    } catch (e) {
      console.error("Failed to create client review notifications:", e);
    }

    return NextResponse.json({ success: true, status: result.current_status });
  } catch (error) {
    console.error("Failed to perform client review:", error);
    return NextResponse.json({ error: "Failed to submit client review" }, { status: 500 });
  }
}

