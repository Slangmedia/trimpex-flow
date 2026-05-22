import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureUploadsSymlink } from "@/lib/symlink";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    ensureUploadsSymlink();

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
      const targetHostname = targetUrl ? new URL(targetUrl).hostname : "";
      const isRequestingProduction = requestUrl.hostname === targetHostname;

      if (isTargetRemote && !isRequestingProduction) {
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
    else if (ext === ".avif") contentType = "image/avif";
    else if (ext === ".heic") contentType = "image/heic";
    else if (ext === ".heif") contentType = "image/heif";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";
    else if (ext === ".pdf") contentType = "application/pdf";

    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    // Handle range requests (crucial for iOS/Safari videos and large images)
    const range = request.headers.get("range");
    if (range && range.startsWith("bytes=")) {
      const rangeSpec = range.substring(6);
      const parts = rangeSpec.split("-");
      if (parts.length === 2) {
        let start = NaN;
        let end = NaN;

        if (parts[0] === "") {
          // Suffix range: bytes=-500 -> last 500 bytes
          const suffix = parseInt(parts[1], 10);
          if (!isNaN(suffix)) {
            start = fileSize - suffix;
            end = fileSize - 1;
          }
        } else {
          start = parseInt(parts[0], 10);
          if (parts[1] !== "") {
            end = parseInt(parts[1], 10);
          } else {
            end = fileSize - 1;
          }
        }

        if (!isNaN(start)) {
          // Cap end to fileSize - 1
          if (isNaN(end) || end >= fileSize) {
            end = fileSize - 1;
          }

          if (start >= 0 && start < fileSize && start <= end) {
            const chunk = fileBuffer.subarray(start, end + 1);
            return new NextResponse(chunk, {
              status: 206,
              headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunk.length.toString(),
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          } else {
            // Requested range is out of bounds
            return new NextResponse(null, {
              status: 416,
              headers: {
                "Content-Range": `bytes */${fileSize}`,
                "Accept-Ranges": "bytes",
              },
            });
          }
        }
      }
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
