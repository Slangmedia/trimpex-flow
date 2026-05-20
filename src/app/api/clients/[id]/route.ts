import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            renderItems: true,
            employees: {
              include: {
                employee: true
              }
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const assignedEmployeeIds: string[] = [];
    client.projects.forEach(p => {
      p.employees.forEach(pe => {
        if (!assignedEmployeeIds.includes(pe.employee_id)) {
          assignedEmployeeIds.push(pe.employee_id);
        }
      });
    });

    const mappedProjects = client.projects.map((project) => {
      const progress = {
        complete: 0,
        pendingReview: 0,
        clientPending: 0
      };

      project.renderItems.forEach((item) => {
        if (item.current_status === "COMPLETE") {
          progress.complete++;
        } else if (item.current_status === "SUBMITTED" || item.current_status === "ADMIN_REJECTED" || item.current_status === "REVISION_REQUIRED") {
          progress.pendingReview++;
        } else if (item.current_status === "CLIENT_PENDING") {
          progress.clientPending++;
        }
      });

      return {
        id: project.id,
        name: project.name,
        deadline: project.deadline.toISOString().split("T")[0],
        totalRenders: project.total_render_count,
        progress
      };
    });

    return NextResponse.json({
      id: client.id,
      logo: client.logo_url || "",
      name: client.name,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone || "",
      publicLinkToken: client.public_link_token,
      isActive: client.is_active,
      pinEnabled: client.pin_enabled,
      pin: client.pin_hash || "",
      assignedEmployeeIds,
      projects: mappedProjects
    });
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, contactPerson, email, phone, logoUrl, pinEnabled, pin, assignedEmployeeIds } = body;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    if (!name || !contactPerson || !email) {
      return NextResponse.json({ error: "Missing required fields: name, contactPerson, email" }, { status: 400 });
    }

    // Step 1: Update client record
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        contact_person: contactPerson,
        email,
        phone: phone || null,
        logo_url: logoUrl || null,
        pin_enabled: pinEnabled ?? false,
        pin_hash: pin || null,
      },
    });

    // Step 2: If employee assignments provided, update them for all client projects
    if (assignedEmployeeIds && Array.isArray(assignedEmployeeIds)) {
      const projects = await prisma.project.findMany({
        where: { client_id: id },
        select: { id: true },
      });

      for (const proj of projects) {
        // Remove existing assignments
        await prisma.projectEmployee.deleteMany({
          where: { project_id: proj.id },
        });

        // Re-insert new ones (skip duplicates via try/catch)
        for (const empId of assignedEmployeeIds) {
          try {
            await prisma.projectEmployee.create({
              data: {
                project_id: proj.id,
                employee_id: empId,
              },
            });
          } catch (innerErr) {
            console.warn(`Skipping duplicate assignment: project=${proj.id}, emp=${empId}`, innerErr);
          }
        }
      }
    }

    return NextResponse.json({
      id: updatedClient.id,
      logo: updatedClient.logo_url || "",
      name: updatedClient.name,
      contactPerson: updatedClient.contact_person,
      email: updatedClient.email,
      phone: updatedClient.phone || "",
      publicLinkToken: updatedClient.public_link_token,
      isActive: updatedClient.is_active,
      pinEnabled: updatedClient.pin_enabled,
      pin: updatedClient.pin_hash || "",
    });
  } catch (error: any) {
    console.error("Failed to update client — full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to update client", detail: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Perform cascade delete safely for MySQL foreign key relationships
    const projects = await prisma.project.findMany({
      where: { client_id: id }
    });
    const projectIds = projects.map(p => p.id);

    if (projectIds.length > 0) {
      // 1. Delete notifications related to projects
      await prisma.notification.deleteMany({
        where: { related_project_id: { in: projectIds } }
      });

      // 2. Delete project assignments
      await prisma.projectEmployee.deleteMany({
        where: { project_id: { in: projectIds } }
      });

      // 3. Find and delete render items and their versions
      const renderItems = await prisma.renderItem.findMany({
        where: { project_id: { in: projectIds } }
      });
      const renderItemIds = renderItems.map(ri => ri.id);

      if (renderItemIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { related_render_id: { in: renderItemIds } }
        });

        await prisma.renderVersion.deleteMany({
          where: { render_item_id: { in: renderItemIds } }
        });

        await prisma.renderItem.deleteMany({
          where: { project_id: { in: projectIds } }
        });
      }

      // 4. Delete the projects
      await prisma.project.deleteMany({
        where: { client_id: id }
      });
    }

    // 5. Delete the client itself
    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Failed to delete client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
