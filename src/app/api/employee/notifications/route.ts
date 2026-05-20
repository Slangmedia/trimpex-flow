import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch real notifications from the database
    // Fetch all for the employee user and general project broadcasts
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const mappedNotifications = notifications.map((notif) => {
      const diffMs = Date.now() - new Date(notif.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let time = "Just now";
      if (diffDays > 0) {
        time = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        time = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMins > 0) {
        time = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      }

      return {
        id: notif.id,
        type: notif.type,
        message: notif.message,
        time,
        read: notif.is_read
      };
    });

    return NextResponse.json(mappedNotifications);
  } catch (error) {
    console.error("Failed to load employee notifications:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}
