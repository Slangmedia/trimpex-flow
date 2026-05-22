import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getFilesRecursively(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(filePath, baseDir));
      } else {
        results.push(path.relative(baseDir, filePath));
      }
    }
  } catch (e) {}
  return results;
}

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
      results.uploadsFolder.contents = getFilesRecursively(uploadDir);
    }
  } catch (err: any) {
    results.uploadsFolder.error = err.message;
  }

  return NextResponse.json(results);
}
