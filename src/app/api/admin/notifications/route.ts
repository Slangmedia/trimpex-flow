import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch real notifications from the database for this specific admin
    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId
      },
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
    console.error("Failed to load admin notifications:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Mark all as read
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark admin notifications as read:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
