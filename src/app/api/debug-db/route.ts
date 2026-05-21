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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Protect the endpoint
  if (secret !== "Flow2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    processEnv: {
      DATABASE_URL: obfuscateUrl(process.env.DATABASE_URL),
      PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE || "not_set",
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

  return NextResponse.json(results);
}
