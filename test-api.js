const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const userId = "employee-user-id";
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
    const counts = { pending: 0, complete: 0, rejected: 0 };
    project.renderItems.forEach((item) => {
      if (item.current_status === "COMPLETE") {
        counts.complete++;
      } else if (item.current_status === "SUBMITTED" || item.current_status === "ADMIN_REJECTED" || item.current_status === "REVISION_REQUIRED") {
        counts.pending++;
      } else if (item.current_status === "CLIENT_PENDING") {
        counts.rejected++;
      }
    });

    return {
      id: project.id,
      projectName: project.name,
      clientName: project.client ? project.client.name : 'Unknown',
      deadline: project.deadline.toISOString().split("T")[0],
      progress: { completed: counts.complete, total: project.renderItems.length || project.total_render_count },
      counts
    };
  });
  console.log(JSON.stringify(mappedProjects, null, 2));
}
main().then(() => process.exit(0));
