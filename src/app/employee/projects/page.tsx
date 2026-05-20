"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEmployeeProjects() {
      try {
        const res = await fetch("/api/employee/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (e) {
        console.error("Failed to fetch employee projects", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployeeProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground mt-1">Projects assigned to you for rendering.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading assigned projects from live database...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          No projects assigned to you yet in the database.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progressPercent = project.progress.total > 0 
              ? (project.progress.completed / project.progress.total) * 100 
              : 0;
            
            return (
              <Link href={`/employee/projects/${project.id}`} key={project.id} className="block group">
                <Card className="flex flex-col hover:border-primary/50 transition-colors h-full cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <CardTitle className="text-lg leading-tight">{project.projectName}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={project.isOverdue ? "bg-status-rejected/20 text-status-rejected-foreground border-transparent" : "bg-muted text-muted-foreground border-transparent"}
                    >
                      {project.deadline}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.clientName}</p>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.progress.completed} of {project.progress.total} renders</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-status-complete-foreground" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending</span>
                      <span className="text-sm font-medium">{project.counts.pending}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Complete</span>
                      <span className="text-sm font-medium text-status-complete-foreground">{project.counts.complete}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Feedback</span>
                      <span className="text-sm font-medium text-status-rejected-foreground">{project.counts.rejected}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="w-full flex items-center justify-center h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors group-hover:bg-primary/90">
                    Open Project <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
