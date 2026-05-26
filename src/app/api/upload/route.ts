import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";


export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate - allow either active session OR valid dev-upload token matching NEXTAUTH_SECRET
    const session = await getServerSession(authOptions);
    const devToken = req.headers.get("x-dev-upload-token");
    const isTokenValid = devToken && devToken === process.env.NEXTAUTH_SECRET;

    if (!session?.user && !isTokenValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. If running locally in development mode and NEXTAUTH_URL is a remote server, forward the upload there.
    const isDev = process.env.NODE_ENV !== "production";
    const targetUrl = process.env.NEXTAUTH_URL;
    const isTargetRemote = targetUrl && !targetUrl.includes("localhost") && !targetUrl.includes("127.0.0.1");
    const requestUrl = new URL(req.url);
    const targetHostname = targetUrl ? new URL(targetUrl).hostname : "";
    const isRequestingProduction = requestUrl.hostname === targetHostname;

    if (isDev && isTargetRemote && !isRequestingProduction && !devToken) {
      const forwardUrl = `${targetUrl.replace(/\/$/, "")}/api/upload`;
      const forwardFormData = new FormData();
      forwardFormData.append("file", file);

      try {
        const response = await fetch(forwardUrl, {
          method: "POST",
          headers: {
            "x-dev-upload-token": process.env.NEXTAUTH_SECRET || "",
          },
          body: forwardFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        } else {
          const text = await response.text();
          console.error("Failed to forward upload to production:", text);
          // If forwarding fails, fallback to local disk save so local dev doesn't break
        }
      } catch (err) {
        console.error("Error forwarding upload to production:", err);
        // If forwarding fails, fallback to local disk save so local dev doesn't break
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    
    // Optimize folder structure: segregate by environment (local vs production) and date (YYYY-MM)
    const isProd = process.env.NODE_ENV === "production";
    const envFolder = isProd ? "production" : "local";
    const dateFolder = new Date().toISOString().slice(0, 7); // e.g. "2026-05"
    const relativeUploadDir = path.join(envFolder, dateFolder);

    // Determine target upload directory: write directly to public_html/uploads in production
    const publicHtmlDir = path.resolve(process.cwd(), "..", "public_html");
    const isProdServer = existsSync(publicHtmlDir);
    
    const baseUploadDir = isProdServer 
      ? path.join(publicHtmlDir, "uploads")
      : path.join(process.cwd(), "public", "uploads");


    // Ensure upload directory exists
    const uploadDir = path.join(baseUploadDir, relativeUploadDir);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL using forward slashes
    return NextResponse.json({ url: `/uploads/${envFolder}/${dateFolder}/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
