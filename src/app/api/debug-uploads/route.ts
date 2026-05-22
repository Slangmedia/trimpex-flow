import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "Flow2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
      NODE_ENV: process.env.NODE_ENV || "NOT_SET",
    },
    uploadsFolder: {
      path: "",
      exists: false,
      contents: [] as string[],
      error: null as string | null,
    }
  };

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    results.uploadsFolder.path = uploadDir;
    
    if (fs.existsSync(uploadDir)) {
      results.uploadsFolder.exists = true;
      const files = fs.readdirSync(uploadDir);
      results.uploadsFolder.contents = files;
    }
  } catch (err: any) {
    results.uploadsFolder.error = err.message;
  }

  return NextResponse.json(results);
}
