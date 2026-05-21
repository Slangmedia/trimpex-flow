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

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        deadline: true,
        total_render_count: true,
        client: {
          select: { name: true }
        },
        _count: {
          select: { renderItems: true }
        },
        renderItems: {
          select: { current_status: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedProjects = projects.map((project) => {
      const progress = { complete: 0, pendingReview: 0, clientPending: 0 };
      project.renderItems.forEach((item) => {
        if (item.current_status === "COMPLETE") progress.complete++;
        else if (["SUBMITTED", "ADMIN_REJECTED", "REVISION_REQUIRED"].includes(item.current_status)) progress.pendingReview++;
        else if (item.current_status === "CLIENT_PENDING") progress.clientPending++;
      });

      return {
        id: project.id,
        name: project.name,
        clientName: project.client.name,
        deadline: project.deadline.toISOString().split("T")[0],
        totalRenders: project.total_render_count,
        progress
      };
    });

    return NextResponse.json(mappedProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, totalRenders, deadline, clientId, employees } = body;

    if (!name || !clientId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = session.user.id;

    const deadlineDate = deadline ? new Date(deadline) : new Date();

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        total_render_count: parseInt(totalRenders) || 0,
        deadline: deadlineDate,
        client_id: clientId,
        created_by_id: adminId
      },
      include: {
        client: true
      }
    });

    // Handle employee assignments
    if (employees && Array.isArray(employees)) {
      for (const empId of employees) {
        await prisma.projectEmployee.create({
          data: {
            project_id: newProject.id,
            employee_id: empId
          }
        });
      }
    }

    return NextResponse.json({
      id: newProject.id,
      name: newProject.name,
      clientName: newProject.client.name,
      deadline: newProject.deadline.toISOString().split("T")[0],
      totalRenders: newProject.total_render_count,
      progress: { complete: 0, pendingReview: 0, clientPending: 0 }
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
