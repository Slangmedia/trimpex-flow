import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            employees: {
              some: {
                employee_id: userId
              }
            }
          },
          {
            renderItems: {
              some: {
                created_by_id: userId
              }
            }
          }
        ]
      },
      include: {
        client: true,
        renderItems: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedProjects = projects.map((project) => {
      const counts = {
        pending: 0,
        complete: 0,
        rejected: 0
      };

      const userRenders = project.renderItems.filter(item => item.created_by_id === userId);

      userRenders.forEach((item) => {
        if (item.current_status === "COMPLETE") {
          counts.complete++;
        } else if (item.current_status === "SUBMITTED" || item.current_status === "ADMIN_REJECTED" || item.current_status === "REVISION_REQUIRED") {
          counts.pending++;
        } else if (item.current_status === "CLIENT_PENDING") {
          counts.rejected++; // Mapping client action pending
        }
      });

      const total = userRenders.length;

      return {
        id: project.id,
        projectName: project.name,
        clientName: project.client.name,
        deadline: project.deadline.toISOString().split("T")[0],
        isOverdue: new Date(project.deadline) < new Date() && counts.complete < total,
        progress: { completed: counts.complete, total: total },
        counts
      };
    });

    return NextResponse.json(mappedProjects);
  } catch (error) {
    console.error("Failed to fetch employee projects:", error);
    return NextResponse.json({ error: "Failed to fetch employee projects" }, { status: 500 });
  }
}
