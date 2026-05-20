"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/StatusPill";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (e) {
        console.error("Failed to fetch projects from API", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project and all its renders/files? This action is permanent!")) {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        if (res.ok) {
          setProjects(projects.filter((p) => p.id !== id));
        } else {
          alert("Failed to delete project from database.");
        }
      } catch (e) {
        console.error("Failed to delete project", e);
        alert("An error occurred while deleting the project.");
      }
    }
  };

  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage all rendering projects across clients.</p>
        </div>

        <Link href="/admin/projects/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-5">
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-center">Renders</TableHead>
              <TableHead className="text-center">Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-40 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell className="text-center"><div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                  <TableCell><div className="flex justify-center gap-4">{Array.from({length:3}).map((_,j)=><div key={j} className="h-5 w-12 bg-muted rounded-full animate-pulse" />)}</div></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-16 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No projects found in the database.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell>
                    <Link href={`/admin/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
                  <TableCell>{project.deadline}</TableCell>
                  <TableCell className="text-center">{project.totalRenders}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <StatusPill status="COMPLETE" />
                        <span className="text-sm font-bold">{project.progress.complete}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <StatusPill status="SUBMITTED" />
                        <span className="text-sm font-bold">{project.progress.pendingReview}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <StatusPill status="CLIENT_PENDING" />
                        <span className="text-sm font-bold">{project.progress.clientPending}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
