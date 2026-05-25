import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      // Lazy initialization: create the default record if it doesn't exist
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          companyName: "3DFlow",
          supportEmail: "support@3dflow.com",
          accentColor: "indigo",
          logoUrl: null,
          copyrightText: "© 2026 3DFlow. All rights reserved."
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch branding settings:", error);
    return NextResponse.json({ error: "Failed to fetch branding settings" }, { status: 500 });
  }
}
