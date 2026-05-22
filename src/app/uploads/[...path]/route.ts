import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePathSegments = params.path;
    if (!filePathSegments || filePathSegments.length === 0) {
      return new NextResponse("File not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filename = filePathSegments[filePathSegments.length - 1];

    if (searchParams.get("debug") === "Flow2026") {
      const relativePath = path.join(...filePathSegments);
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const fullPath = path.join(uploadDir, relativePath);
      const publicHtmlPath = path.resolve(process.cwd(), "..", "public_html", "uploads", relativePath);
      
      return NextResponse.json({
        cwd: process.cwd(),
        pathSegments: filePathSegments,
        relativePath,
        fullPath,
        fullPathExists: fs.existsSync(fullPath),
        publicHtmlPath,
        publicHtmlPathExists: fs.existsSync(publicHtmlPath),
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
          NODE_ENV: process.env.NODE_ENV || "NOT_SET",
        }
      });
    }

    const fileRelativePath = path.join(...filePathSegments);
    let filePath = path.join(process.cwd(), "public", "uploads", fileRelativePath);

    if (!fs.existsSync(filePath)) {
      // Fallback check: look inside public_html/uploads
      const publicHtmlPath = path.resolve(process.cwd(), "..", "public_html", "uploads", fileRelativePath);
      if (fs.existsSync(publicHtmlPath)) {
        filePath = publicHtmlPath;
      }
    }

    if (!fs.existsSync(filePath)) {
      // If the file is not found locally, check if we should fallback redirect to production
      const targetUrl = process.env.NEXTAUTH_URL;
      const isTargetRemote = targetUrl && !targetUrl.includes("localhost") && !targetUrl.includes("127.0.0.1");
      const requestUrl = new URL(request.url);
      const isRequestLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1" || requestUrl.hostname.startsWith("192.168.") || requestUrl.hostname.startsWith("10.");

      if (isTargetRemote && isRequestLocal) {
        const remoteFileUrl = `${targetUrl.replace(/\/$/, "")}/uploads/${filePathSegments.join("/")}`;
        return NextResponse.redirect(remoteFileUrl, 307);
      }

      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
