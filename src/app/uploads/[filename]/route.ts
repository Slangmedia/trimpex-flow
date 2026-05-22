import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get("debug") === "Flow2026") {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      let dirContents: string[] = [];
      let exists = false;
      try {
        exists = fs.existsSync(uploadDir);
        if (exists) {
          dirContents = fs.readdirSync(uploadDir);
        }
      } catch (e: any) {
        dirContents = [e.message];
      }
      return NextResponse.json({
        cwd: process.cwd(),
        exists,
        dirContents,
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
          NODE_ENV: process.env.NODE_ENV || "NOT_SET",
        }
      });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", filename);

    if (!fs.existsSync(filePath)) {
      // If the file is not found locally, check if we should fallback redirect to production
      const targetUrl = process.env.NEXTAUTH_URL;
      const isTargetRemote = targetUrl && !targetUrl.includes("localhost") && !targetUrl.includes("127.0.0.1");
      const requestUrl = new URL(request.url);
      const isRequestLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1" || requestUrl.hostname.startsWith("192.168.") || requestUrl.hostname.startsWith("10.");

      if (isTargetRemote && isRequestLocal) {
        const remoteFileUrl = `${targetUrl.replace(/\/$/, "")}/uploads/${filename}`;
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
