import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const download = searchParams.get("download");

    if (!fileUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // Security check: only allow local uploads
    if (!fileUrl.startsWith("/uploads/")) {
      return new NextResponse("Invalid file URL", { status: 400 });
    }

    const relativePath = fileUrl.replace(/^\/uploads\//, "");
    const filename = path.basename(relativePath);
    const cleanFileName = filename.replace(/^\d+-\d+-/, "").replace(/^\d+-/, "");
    const spaceFileName = cleanFileName.replace(/[_-]/g, " ");
    const relativeDir = path.dirname(relativePath);
    
    const filePathSegments = relativePath.split("/");
    const firstSegment = filePathSegments.length > 0 ? filePathSegments[0] : "";

    // We will check multiple base upload directories
    const baseUploadDirs = [
      path.join(os.homedir(), "renderflow_uploads"),
      path.join(os.homedir(), "Downloads", "uploads"),
      path.join(process.cwd(), "public", "uploads"),
    ];

    const possiblePaths: string[] = [];

    // Add direct relative path matches
    possiblePaths.push(path.join(process.cwd(), "public", "uploads", relativePath));
    for (const baseDir of baseUploadDirs) {
      possiblePaths.push(path.join(baseDir, relativePath));
    }

    // Add segment/clean-name/space-name fallbacks
    for (const baseDir of baseUploadDirs) {
      // 1. Direct clean/space names in base directory
      possiblePaths.push(path.join(baseDir, cleanFileName));
      possiblePaths.push(path.join(baseDir, spaceFileName));

      // 2. Clean/space names in the first segment folder (e.g. production/ANIMA BROWN.png)
      if (firstSegment) {
        possiblePaths.push(path.join(baseDir, firstSegment, cleanFileName));
        possiblePaths.push(path.join(baseDir, firstSegment, spaceFileName));
        possiblePaths.push(path.join(baseDir, firstSegment, filename));
      }

      // 3. Clean/space names in full subfolder path (e.g. production/2026-05/ANIMA BROWN.png)
      if (relativeDir && relativeDir !== ".") {
        possiblePaths.push(path.join(baseDir, relativeDir, cleanFileName));
        possiblePaths.push(path.join(baseDir, relativeDir, spaceFileName));
      }
    }

    // Add other web root relative paths
    possiblePaths.push(
      path.resolve(process.cwd(), "..", "public_html", "uploads", relativePath),
      path.resolve(process.cwd(), "..", "public_html", "flow", "uploads", relativePath),
      path.resolve(process.cwd(), "..", "public_html", "flow.trimpexstudio.com", "uploads", relativePath),
      path.resolve(process.cwd(), "..", "flow.trimpexstudio.com", "public", "uploads", relativePath),
      path.resolve(process.cwd(), "uploads", relativePath)
    );

    const filteredPossiblePaths = possiblePaths.filter(p => p !== "");

    let filePath = "";
    for (const p of filteredPossiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!fs.existsSync(filePath)) {
      const isDev = process.env.NODE_ENV !== "production";
      const targetUrl = process.env.NEXTAUTH_URL;
      const isTargetRemote = targetUrl && !targetUrl.includes("localhost") && !targetUrl.includes("127.0.0.1");
      
      if (isDev && isTargetRemote) {
        const remoteFileUrl = `${targetUrl.replace(/\/$/, "")}/uploads/${relativePath}`;
        return NextResponse.redirect(remoteFileUrl, 307);
      }
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".avif") contentType = "image/avif";
    else if (ext === ".heic") contentType = "image/heic";
    else if (ext === ".heif") contentType = "image/heif";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";

    const fileBuffer = fs.readFileSync(filePath);
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", fileBuffer.length.toString());
    // Cache for 30 days since renders do not change after upload
    headers.set("Cache-Control", "public, max-age=2592000, immutable");

    if (download === "1") {
      const filename = path.basename(filePath);
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      const filename = path.basename(filePath);
      headers.set("Content-Disposition", `inline; filename="${filename}"`);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving original file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
