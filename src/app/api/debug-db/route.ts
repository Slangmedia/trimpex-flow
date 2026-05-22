import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma as destPrisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function obfuscateUrl(url: string | undefined): string {
  if (!url) return "NOT_SET";
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      const len = parsed.password.length;
      const first = parsed.password.substring(0, Math.min(2, len));
      const last = parsed.password.substring(Math.max(0, len - 2));
      parsed.password = `${first}***${last}`;
    }
    return parsed.toString();
  } catch (e) {
    // Fallback if URL constructor fails
    return url.replace(/:([^:@]+)@/, (_, p) => {
      const len = p.length;
      const first = p.substring(0, Math.min(2, len));
      const last = p.substring(Math.max(0, len - 2));
      return `:${first}***${last}@`;
    });
  }
}

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

  // Protect the endpoint
  if (secret !== "Flow2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = searchParams.get("action");
  if (action === "sync-uploads") {
    const localUploadsDir = path.join(process.cwd(), "public", "uploads");
    const publicHtmlDir = path.resolve(process.cwd(), "..", "public_html");
    const publicHtmlUploadsDir = path.join(publicHtmlDir, "uploads");

    if (!fs.existsSync(localUploadsDir)) {
      return NextResponse.json({ 
        error: `Local uploads directory does not exist at ${localUploadsDir}`,
        processCwd: process.cwd() 
      }, { status: 400 });
    }

    if (!fs.existsSync(publicHtmlDir)) {
      return NextResponse.json({ 
        error: `public_html directory does not exist at ${publicHtmlDir}. If you are running locally, this is expected as public_html is only on the production server.`,
        processCwd: process.cwd()
      }, { status: 400 });
    }

    if (!fs.existsSync(publicHtmlUploadsDir)) {
      try {
        fs.mkdirSync(publicHtmlUploadsDir, { recursive: true });
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to create public_html/uploads: ${err.message}` }, { status: 500 });
      }
    }

    try {
      const relativeFiles = getFilesRecursively(localUploadsDir);
      const copied: string[] = [];
      const skipped: string[] = [];
      const failed: any[] = [];

      for (const relPath of relativeFiles) {
        const srcPath = path.join(localUploadsDir, relPath);
        const destPath = path.join(publicHtmlUploadsDir, relPath);
        
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        if (!fs.existsSync(destPath)) {
          try {
            fs.copyFileSync(srcPath, destPath);
            copied.push(relPath);
          } catch (err: any) {
            failed.push({ file: relPath, error: err.message });
          }
        } else {
          skipped.push(relPath);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Sync completed. Copied: ${copied.length}, Skipped: ${skipped.length}, Failed: ${failed.length}`,
        copied,
        skippedCount: skipped.length,
        failed
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to sync: ${err.message}` }, { status: 500 });
    }
  }

  let outgoingIp = "unknown";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (ipRes.ok) {
      const ipJson = await ipRes.json();
      outgoingIp = ipJson.ip;
    }
  } catch (ipErr) {
    // Ignore
  }

  let publicHtmlExists = false;
  let publicHtmlUploadsDirExists = false;
  let publicHtmlUploadsContents: string[] = [];
  let nodejsPublicUploadsExists = false;
  let nodejsPublicUploadsContents: string[] = [];
  let parentDirDirs: string[] = [];

  try {
    const parentDir = path.resolve(process.cwd(), "..");
    if (fs.existsSync(parentDir)) {
      parentDirDirs = fs.readdirSync(parentDir);
    }
    const publicHtmlDir = path.resolve(process.cwd(), "..", "public_html");
    publicHtmlExists = fs.existsSync(publicHtmlDir);
    if (publicHtmlExists) {
      const publicHtmlUploadsDir = path.join(publicHtmlDir, "uploads");
      publicHtmlUploadsDirExists = fs.existsSync(publicHtmlUploadsDir);
      if (publicHtmlUploadsDirExists) {
        publicHtmlUploadsContents = getFilesRecursively(publicHtmlUploadsDir).slice(0, 50);
      }
    }

    const localUploadsDir = path.join(process.cwd(), "public", "uploads");
    nodejsPublicUploadsExists = fs.existsSync(localUploadsDir);
    if (nodejsPublicUploadsExists) {
      nodejsPublicUploadsContents = getFilesRecursively(localUploadsDir).slice(0, 50);
    }
  } catch (err: any) {
    parentDirDirs = ["Error listing directories: " + err.message];
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    outgoingIp,
    processCwd: process.cwd(),
    parentDirDirs,
    publicHtmlExists,
    publicHtmlUploadsDirExists,
    publicHtmlUploadsContents,
    nodejsPublicUploadsExists,
    nodejsPublicUploadsContents,
    processEnv: {
      DATABASE_URL: obfuscateUrl(process.env.DATABASE_URL),
      PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE || "not_set",
      TOKIO_WORKER_THREADS: process.env.TOKIO_WORKER_THREADS || "not_set",
      NODE_ENV: process.env.NODE_ENV || "not_set",
    },
    envFile: {
      exists: false,
      contentObfuscated: "",
    },
    databaseConnection: {
      globalClient: {
        success: false,
        error: null,
      },
      newClient: {
        success: false,
        error: null,
      }
    }
  };

  // 1. Read .env from server
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      results.envFile.exists = true;
      const content = fs.readFileSync(envPath, "utf8");
      results.envFile.contentObfuscated = content
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("DATABASE_URL=")) {
            // Extract the value, keeping quotes if present
            const match = trimmed.match(/^DATABASE_URL=["']?(.*?)["']?$/);
            const val = match ? match[1] : trimmed.substring("DATABASE_URL=".length);
            return `DATABASE_URL="${obfuscateUrl(val)}"`;
          }
          if (trimmed.startsWith("NEXTAUTH_SECRET=")) {
            return "NEXTAUTH_SECRET=\"***\"";
          }
          return line;
        })
        .join("\n");
    }
  } catch (e: any) {
    results.envFile.error = e.message;
  }

  // 2. Test global client
  try {
    await destPrisma.user.findFirst({ select: { id: true } });
    results.databaseConnection.globalClient.success = true;
  } catch (e: any) {
    results.databaseConnection.globalClient.error = {
      message: e.message,
      code: e.code,
      meta: e.meta,
    };
  }

  // 3. Test new client with current process.env.DATABASE_URL
  try {
    const tempPrisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
    await tempPrisma.user.findFirst({ select: { id: true } });
    results.databaseConnection.newClient.success = true;
    await tempPrisma.$disconnect();
  } catch (e: any) {
    results.databaseConnection.newClient.error = {
      message: e.message,
      code: e.code,
      meta: e.meta,
    };
  }

  // 4. Test connection via 127.0.0.1 and localhost
  let localhostUrl = "";
  let loopbackUrl = "";
  try {
    const rawUrl = process.env.DATABASE_URL || "";
    loopbackUrl = rawUrl.replace(/@[^/]+/, "@127.0.0.1:3306");
    localhostUrl = rawUrl.replace(/@[^/]+/, "@localhost:3306");
  } catch (err) {}

  results.databaseConnection.loopbackClient = { success: false, error: null };
  results.databaseConnection.localhostClient = { success: false, error: null };

  if (loopbackUrl) {
    try {
      const tempPrisma = new PrismaClient({
        datasourceUrl: loopbackUrl,
      });
      await tempPrisma.user.findFirst({ select: { id: true } });
      results.databaseConnection.loopbackClient.success = true;
      await tempPrisma.$disconnect();
    } catch (e: any) {
      results.databaseConnection.loopbackClient.error = {
        message: e.message,
      };
    }
  }

  if (localhostUrl) {
    try {
      const tempPrisma = new PrismaClient({
        datasourceUrl: localhostUrl,
      });
      await tempPrisma.user.findFirst({ select: { id: true } });
      results.databaseConnection.localhostClient.success = true;
      await tempPrisma.$disconnect();
    } catch (e: any) {
      results.databaseConnection.localhostClient.error = {
        message: e.message,
      };
    }
  }

  return NextResponse.json(results);
}
