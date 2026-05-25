"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const defaultClients = [
  {
    name: "Acme Corp",
    publicLinkToken: "abc-123-xyz",
    pinEnabled: true,
  },
  {
    name: "Stark Industries",
    publicLinkToken: "def-456-uvw",
    pinEnabled: true,
  },
  {
    name: "Cyberdyne Systems",
    publicLinkToken: "cyberdyne-token-2026",
    pinEnabled: true,
  }
];

const defaultProjects = [
  {
    id: "1",
    projectName: "Spring Collection 2026",
    clientName: "Acme Corp",
    description: "Full suite of renders for the upcoming spring catalog, featuring living room and kitchen scenes.",
    deadline: "2026-06-01",
    counts: { approved: 15, pending: 3, rejected: 2 }
  },
  {
    id: "2",
    projectName: "Mark V Renders",
    clientName: "Stark Industries",
    description: "Renders for the new Mark V suit design and armor interfaces.",
    deadline: "2026-05-20",
    counts: { approved: 8, pending: 1, rejected: 1 }
  },
  {
    id: "3",
    projectName: "T-800 Endoskeleton Renders",
    clientName: "Cyberdyne Systems",
    description: "High-resolution renders of the T-800 CPU architecture and structural chassis.",
    deadline: "2026-08-29",
    counts: { approved: 10, pending: 3, rejected: 2 }
  }
];

export default function ClientPortalPage({ params }: { params: { token: string } }) {
  const [client, setClient] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [branding, setBranding] = useState({ companyName: "3DFlow", logoUrl: "" });

  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch("/api/branding");
        if (res.ok) {
          const data = await res.json();
          setBranding({
            companyName: data.companyName || "3DFlow",
            logoUrl: data.logoUrl || "",
          });
        }
      } catch (e) {
        console.error("Failed to load branding in client portal", e);
      }
    }
    loadBranding();
  }, []);

  useEffect(() => {
    async function loadClientPortal() {
      try {
        const res = await fetch(`/api/client-portal/${params.token}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
          setProjects(data.projects);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to load client portal data", e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadClientPortal();
  }, [params.token]);

  if (!isLoaded || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading Client Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-7 w-auto object-contain max-w-[140px]" />
          ) : (
            <h1 className="text-xl font-bold tracking-tight">{branding.companyName}</h1>
          )}
        </div>
        <div className="text-sm font-medium">{client.name}</div>
      </header>
      
      <main className="flex-1 w-full p-5">
        <div className="mb-8">
          <h2 className="text-[20px] font-normal">Welcome, {client.name}</h2>
          <p className="text-muted-foreground mt-1 text-sm">Select a project to review your renders.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/c/${params.token}/${project.id}`} key={project.id} className="block group">
              <Card className="flex flex-col hover:border-primary/50 transition-colors h-full cursor-pointer">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{project.projectName}</CardTitle>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{project.deadline}</span>
                </div>

                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-status-complete/20 text-status-complete-foreground text-xs font-medium">
                    {project.counts.approved} Approved
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-status-pending/50 text-status-pending-foreground text-xs font-medium">
                    {project.counts.pending} Pending
                  </span>
                  {project.counts.rejected > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-status-rejected/20 text-status-rejected-foreground text-xs font-medium">
                      {project.counts.rejected} Rejected
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="w-full flex items-center justify-center h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors group-hover:bg-primary/90">
                  View Renders <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardFooter>
            </Card>
          </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
