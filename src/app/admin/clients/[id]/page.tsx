"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Plus, Check, MoreHorizontal } from "lucide-react";
import { useHeaderStore } from "@/lib/store/headerStore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusPill } from "@/components/StatusPill";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const setTitle = useHeaderStore((state) => state.setTitle);

  const fetchClientData = async () => {
    try {
      const res = await fetch(`/api/clients/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setTitle(data.name); // Dynamic Header Update!
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Failed to load client details", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
    
    return () => {
      setTitle(null); // Clear title on unmount
    };
  }, [params.id]);

  const copyLink = () => {
    if (!client) return;
    const link = `${window.location.origin}/c/${client.publicLinkToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Loading client details from live database...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Client not found.
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 w-full">
      <div>
        <Link href="/admin/clients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={client.logo} />
              <AvatarFallback className="text-xl bg-accent text-accent-foreground">
                {client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{client.contactPerson}</span>
                <span>•</span>
                <span>{client.email}</span>
                {client.phone && (
                  <>
                    <span>•</span>
                    <span>{client.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={copyLink} className="transition-all">
              {copiedLink ? (
                <><Check className="mr-2 h-4 w-4 text-emerald-500" /> Copied!</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" /> Copy Public Link</>
              )}
            </Button>
            
            <Link href={`/admin/clients/${params.id}/edit`}>
              <Button variant="outline">Edit Client</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Projects</h2>
        </div>

        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Renders</TableHead>
                <TableHead>Progress Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link href={`/admin/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>{project.deadline}</TableCell>
                  <TableCell>{project.totalRenders}</TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <StatusPill status="COMPLETE" />
                        <span className="text-xs font-bold">{project.progress.complete}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <StatusPill status="SUBMITTED" />
                        <span className="text-xs font-bold">{project.progress.pendingReview}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <StatusPill status="CLIENT_PENDING" />
                        <span className="text-xs font-bold">{project.progress.clientPending}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/projects/${project.id}`}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No projects found for this client.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
