"use client";

import { useState, useEffect } from "react";
import { Check, Info, AlertCircle, RefreshCw, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/employee/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates on your assigned projects and renders.</p>
        </div>
        <Button variant="outline" disabled={notifications.length === 0}>Mark all as read</Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border-t border-border">
            You have no notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notif) => (
              <li key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors flex gap-4 ${!notif.read ? "bg-accent/20" : ""}`}>
                <div className="mt-1 flex-shrink-0">
                  {notif.type === "ADMIN_APPROVED" && <Check className="h-5 w-5 text-status-complete-foreground" />}
                  {notif.type === "CLIENT_REQUESTED_CHANGES" && <RefreshCw className="h-5 w-5 text-status-revision-foreground" />}
                  {notif.type === "ADMIN_REJECTED" && <AlertCircle className="h-5 w-5 text-status-internal-foreground" />}
                  {notif.type === "PROJECT_ASSIGNED" && <Briefcase className="h-5 w-5 text-muted-foreground" />}
                  {!["ADMIN_APPROVED", "CLIENT_REQUESTED_CHANGES", "ADMIN_REJECTED", "PROJECT_ASSIGNED"].includes(notif.type) && (
                    <Info className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${!notif.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{notif.time}</p>
                </div>
                {!notif.read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
