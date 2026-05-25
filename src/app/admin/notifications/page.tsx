"use client";

import { useState, useEffect } from "react";
import { Check, Info, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin notifications", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT"
      });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error("Failed to mark admin notifications as read", e);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on render statuses and client actions.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleMarkAllAsRead} 
          disabled={isLoading || !hasUnread}
        >
          Mark all as read
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground font-mono">
            Loading notifications from database...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border-t border-border">
            You have no notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notif) => (
              <li key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors flex gap-4 ${!notif.read ? "bg-accent/20" : ""}`}>
                <div className="mt-1 flex-shrink-0">
                  {notif.type === "CLIENT_APPROVED" && <Check className="h-5 w-5 text-status-complete-foreground" />}
                  {notif.type === "CLIENT_REQUESTED_CHANGES" && <RefreshCw className="h-5 w-5 text-status-revision-foreground" />}
                  {notif.type === "CLIENT_REJECTED" && <AlertCircle className="h-5 w-5 text-status-rejected-foreground" />}
                  {notif.type === "RENDER_SUBMITTED" && <Info className="h-5 w-5 text-status-submitted-foreground" />}
                  {!["CLIENT_APPROVED", "CLIENT_REQUESTED_CHANGES", "CLIENT_REJECTED", "RENDER_SUBMITTED"].includes(notif.type) && (
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

