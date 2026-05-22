import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // 1. Fetch client by public link token
    const client = await prisma.client.findUnique({
      where: { public_link_token: token },
      include: {
        projects: {
          include: {
            renderItems: {
              include: {
                versions: true
              }
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client portal not found" }, { status: 404 });
    }

    const mappedProjects = client.projects.map((proj) => {
      const counts = {
        approved: 0,
        pending: 0,
        rejected: 0
      };

      proj.renderItems.forEach((item) => {
        // Skip entirely if no version has ever been approved by admin
        const approvedVersions = item.versions.filter(
          (v) => v.admin_action === "APPROVED"
        );
        if (approvedVersions.length === 0) return;

        // Determine display status exactly like the project details route
        const isRevisionPending = ["SUBMITTED", "ADMIN_REJECTED", "REVISION_REQUIRED"].includes(item.current_status);
        const displayStatus = isRevisionPending ? "REVISION_PENDING" : item.current_status;

        if (displayStatus === "COMPLETE") {
          counts.approved++;
        } else if (displayStatus === "CLIENT_PENDING") {
          counts.pending++;
        } else if (
          displayStatus === "REJECTED" ||
          displayStatus === "REVISION_REQUIRED" ||
          displayStatus === "REVISION_PENDING"
        ) {
          counts.rejected++;
        }
      });

      return {
        id: proj.id,
        projectName: proj.name,
        description: proj.description || "Full suite of product and lifestyle renders.",
        deadline: proj.deadline.toISOString().split("T")[0],
        counts
      };
    });

    return NextResponse.json({
      client: {
        name: client.name,
        pinEnabled: client.pin_enabled,
        pinHash: client.pin_hash
      },
      projects: mappedProjects
    });
  } catch (error) {
    console.error("Failed to load client portal:", error);
    return NextResponse.json({ error: "Failed to load client portal" }, { status: 500 });
  }
}
