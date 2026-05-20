"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Briefcase, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col justify-center items-center h-[50vh]">
        <div className="animate-pulse font-medium text-lg">Loading live dashboard metrics...</div>
      </div>
    );
  }

  const stats = [
    { title: "Total Clients", value: data?.stats?.totalClients ?? 0, icon: Users },
    { title: "Active Projects", value: data?.stats?.activeProjects ?? 0, icon: Briefcase },
    { title: "Pending Admin Review", value: data?.stats?.pendingAdminReview ?? 0, icon: Clock },
    { title: "Renders Completed This Month", value: data?.stats?.completedRenders ?? 0, icon: CheckCircle },
  ];

  const projects = data?.projects || [];
  const activity = data?.activity || [];

  return (
    <div className="p-5 space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your rendering pipeline.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Projects at a Glance</h2>
          {projects.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No projects created yet.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project: any) => {
                const progressPercent = project.progress.total > 0 
                  ? (project.progress.completed / project.progress.total) * 100 
                  : 0;
                return (
                  <Link href={`/admin/projects/${project.id}`} key={project.id}>
                    <Card className="cursor-pointer hover:border-foreground/20 transition-colors h-full flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base truncate">{project.projectName}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{project.clientName}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{project.progress.completed} of {project.progress.total} completed</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-status-complete-foreground" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 text-xs">
                          <span className="text-muted-foreground">Deadline: {project.deadline}</span>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border">
                          <StatusPill status="SUBMITTED" />
                          <span className="text-xs self-center font-mono">x{project.counts.pending}</span>
                          <StatusPill status="CLIENT_PENDING" />
                          <span className="text-xs self-center font-mono">x{project.counts.clientPending}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Card className="h-full max-h-[480px] overflow-y-auto">
            <CardContent className="p-0">
              {activity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No activity logged yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activity.map((item: any) => (
                    <div key={item.id} className="p-4 space-y-1">
                      <p className="text-sm leading-relaxed">{item.text}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
