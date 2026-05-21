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

    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true }
        },
        projects: {
          select: {
            _count: {
              select: { renderItems: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedClients = clients.map((client) => {
      let activeRendersCount = 0;
      client.projects.forEach((proj) => {
        activeRendersCount += proj._count.renderItems;
      });

      return {
        id: client.id,
        logo: client.logo_url || "",
        name: client.name,
        contactPerson: client.contact_person,
        email: client.email,
        projectsCount: client._count.projects,
        activeRenders: activeRendersCount,
        publicLinkToken: client.public_link_token,
        isActive: client.is_active
      };
    });

    return NextResponse.json(mappedClients);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contactPerson, email, phone, logoUrl } = body;

    if (!name || !contactPerson || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const adminId = session.user.id;

    // Create client and project transactionally
    const newClient = await prisma.client.create({
      data: {
        name,
        contact_person: contactPerson,
        email,
        phone: phone || null,
        logo_url: logoUrl || null,
        created_by_id: adminId
      }
    });

    let projectsCount = 0;

    // Handle initial project creation
    if (body.projectName) {
      projectsCount = 1;
      const renderCount = parseInt(body.projectRenderCount) || 0;
      const deadlineDate = body.projectDeadline ? new Date(body.projectDeadline) : new Date();

      const newProject = await prisma.project.create({
        data: {
          name: body.projectName,
          description: body.projectDescription || null,
          total_render_count: renderCount,
          deadline: deadlineDate,
          client_id: newClient.id,
          created_by_id: adminId
        }
      });

      // Assign employees if provided
      if (body.projectEmployees && Array.isArray(body.projectEmployees)) {
        for (const empName of body.projectEmployees) {
          const empUser = await prisma.user.findFirst({
            where: { name: empName }
          });
          if (empUser) {
            await prisma.projectEmployee.create({
              data: {
                project_id: newProject.id,
                employee_id: empUser.id
              }
            });
          }
        }
      }
    }

    const result = { newClient, projectsCount };

    return NextResponse.json({
      id: result.newClient.id,
      logo: result.newClient.logo_url || "",
      name: result.newClient.name,
      contactPerson: result.newClient.contact_person,
      email: result.newClient.email,
      projectsCount: result.projectsCount,
      activeRenders: 0,
      publicLinkToken: result.newClient.public_link_token,
      isActive: result.newClient.is_active
    });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A client with this email address already exists. Please use a different email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create client. Please check the provided details and try again." }, { status: 500 });
  }
}
