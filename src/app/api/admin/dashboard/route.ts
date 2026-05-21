import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch metrics, projects, and activities in parallel using Promise.all
    const [
      totalClients,
      activeProjects,
      pendingAdminReview,
      completedRenders,
      projects,
      notifications
    ] = await Promise.all([
      prisma.client.count(),
      prisma.project.count({
        where: { is_active: true }
      }),
      prisma.renderVersion.count({
        where: {
          admin_action: null,
          is_current_version: true
        }
      }),
      prisma.renderItem.count({
        where: {
          current_status: "COMPLETE"
        }
      }),
      prisma.project.findMany({
        include: {
          client: { select: { name: true } },
          renderItems: true
        },
        orderBy: { createdAt: "desc" },
        take: 6
      }),
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

    const mappedProjects = projects.map((project) => {
      const total = project.renderItems.length;
      const completed = project.renderItems.filter(item => item.current_status === "COMPLETE").length;
      const pending = project.renderItems.filter(item => item.current_status === "SUBMITTED").length;
      const clientPending = project.renderItems.filter(item => item.current_status === "CLIENT_PENDING").length;

      return {
        id: project.id,
        clientName: project.client.name,
        projectName: project.name,
        progress: { completed, total },
        deadline: project.deadline.toISOString().split("T")[0],
        counts: { pending, clientPending, complete: completed }
      };
    });

    const mappedActivity = notifications.map((notif) => {
      const diffMs = Date.now() - new Date(notif.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let time = "Just now";
      if (diffDays > 0) {
        time = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        time = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMins > 0) {
        time = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      }

      return {
        id: notif.id,
        text: notif.message,
        time
      };
    });

    return NextResponse.json({
      stats: {
        totalClients,
        activeProjects,
        pendingAdminReview,
        completedRenders
      },
      projects: mappedProjects,
      activity: mappedActivity
    });
  } catch (error) {
    console.error("Failed to load admin dashboard stats:", error);
    return NextResponse.json({ error: "Failed to load admin dashboard stats" }, { status: 500 });
  }
}
