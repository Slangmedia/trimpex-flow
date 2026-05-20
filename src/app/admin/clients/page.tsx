import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Copy, Eye, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientRowActions } from "@/components/admin/ClientRowActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClients() {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true }
      },
      projects: {
        select: {
          _count: { select: { renderItems: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return clients.map((client) => {
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
      isActive: client.is_active,
    };
  });
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your clients and their public portals.</p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead className="text-center">Active Renders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No clients found. Add your first client using the button above.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={client.logo} />
                        <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                          {client.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link href={`/admin/clients/${client.id}`} className="font-medium hover:underline">
                          {client.name}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{client.contactPerson}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{client.projectsCount}</TableCell>
                  <TableCell className="text-center">{client.activeRenders}</TableCell>
                  <TableCell>
                    {client.isActive ? (
                      <Badge variant="outline" className="bg-status-complete/20 text-status-complete-foreground border-transparent">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientRowActions
                      clientId={client.id}
                      publicLinkToken={client.publicLinkToken || ""}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
