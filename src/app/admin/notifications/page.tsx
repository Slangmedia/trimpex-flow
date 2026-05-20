"use client";

import { Check, Info, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockNotifications = [
  { id: 1, type: "RENDER_SUBMITTED", message: "Arjun Sharma submitted Living Room Angle 1 (V2)", time: "10 mins ago", read: false },
  { id: 2, type: "CLIENT_APPROVED", message: "Client 'Acme Corp' approved Bedroom Close-up", time: "1 hour ago", read: false },
  { id: 3, type: "CLIENT_REQUESTED_CHANGES", message: "Client requested changes on Patio Wide", time: "4 hours ago", read: true },
];

export default function NotificationsPage() {
  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on render statuses and client actions.</p>
        </div>
        <Button variant="outline">Mark all as read</Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {mockNotifications.map((notif) => (
            <li key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors flex gap-4 ${!notif.read ? "bg-accent/20" : ""}`}>
              <div className="mt-1 flex-shrink-0">
                {notif.type === "CLIENT_APPROVED" && <Check className="h-5 w-5 text-status-complete-foreground" />}
                {notif.type === "CLIENT_REQUESTED_CHANGES" && <RefreshCw className="h-5 w-5 text-status-revision-foreground" />}
                {notif.type === "RENDER_SUBMITTED" && <Info className="h-5 w-5 text-status-submitted-foreground" />}
                {!["CLIENT_APPROVED", "CLIENT_REQUESTED_CHANGES", "RENDER_SUBMITTED"].includes(notif.type) && (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
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
      </div>
    </div>
  );
}
