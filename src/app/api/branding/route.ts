import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cwd = process.cwd();
    const parent = path.resolve(cwd, "..");
    const grandParent = path.resolve(parent, "..");
    
    const listDir = (dirPath: string) => {
      try {
        if (fs.existsSync(dirPath)) {
          return fs.readdirSync(dirPath);
        }
        return `Directory does not exist`;
      } catch (err: any) {
        return `Error: ${err.message}`;
      }
    };

    const debugInfo = {
      cwd,
      cwdContents: listDir(cwd),
      parent,
      parentContents: listDir(parent),
      grandParent,
      grandParentContents: listDir(grandParent),
      publicHtmlUploadsExists: fs.existsSync(path.resolve(cwd, "..", "public_html", "uploads")),
      publicHtmlUploadsContents: listDir(path.resolve(cwd, "..", "public_html", "uploads")),
      publicHtmlFlowUploadsExists: fs.existsSync(path.resolve(cwd, "..", "public_html", "flow", "uploads")),
      publicHtmlFlowUploadsContents: listDir(path.resolve(cwd, "..", "public_html", "flow", "uploads")),
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}
