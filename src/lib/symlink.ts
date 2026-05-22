import fs from "fs";
import path from "path";

export function ensureUploadsSymlink() {
  // Only run this check on the server in production (or if public_html exists)
  try {
    const publicHtmlDir = path.resolve(process.cwd(), "..", "public_html");
    if (!fs.existsSync(publicHtmlDir)) {
      // If public_html doesn't exist, we are likely running locally in dev, so do nothing.
      return;
    }

    const publicHtmlUploadsDir = path.join(publicHtmlDir, "uploads");
    if (!fs.existsSync(publicHtmlUploadsDir)) {
      fs.mkdirSync(publicHtmlUploadsDir, { recursive: true });
    }

    const localUploadsDir = path.join(process.cwd(), "public", "uploads");

    // Check if localUploadsDir exists
    let exists = false;
    let isSymlink = false;

    try {
      const stats = fs.lstatSync(localUploadsDir);
      exists = true;
      isSymlink = stats.isSymbolicLink();
    } catch (e) {
      // Directory/symlink doesn't exist
    }

    if (exists && !isSymlink) {
      console.log(`[Symlink] public/uploads is a regular directory. Preparing to replace with symlink...`);
      // 1. Move any files currently inside it to public_html/uploads so we don't lose anything
      try {
        const files = fs.readdirSync(localUploadsDir);
        for (const file of files) {
          const src = path.join(localUploadsDir, file);
          const dest = path.join(publicHtmlUploadsDir, file);
          
          // Helper to recursively copy directories/files
          const copyRecursiveSync = (srcPath: string, destPath: string) => {
            const stats = fs.statSync(srcPath);
            if (stats.isDirectory()) {
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              const childFiles = fs.readdirSync(srcPath);
              for (const child of childFiles) {
                copyRecursiveSync(path.join(srcPath, child), path.join(destPath, child));
              }
            } else {
              if (!fs.existsSync(destPath)) {
                fs.copyFileSync(srcPath, destPath);
              }
            }
          };

          copyRecursiveSync(src, dest);
        }
      } catch (moveErr) {
        console.error("[Symlink] Error migrating legacy files to public_html/uploads:", moveErr);
      }

      // 2. Remove the directory recursively
      try {
        fs.rmSync(localUploadsDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error("[Symlink] Failed to remove public/uploads:", rmErr);
        return;
      }
    }

    // Now recreate as a symlink pointing to public_html/uploads if missing
    let needsSymlink = false;
    try {
      fs.lstatSync(localUploadsDir);
    } catch (e) {
      needsSymlink = true;
    }

    if (needsSymlink) {
      // Link pointing from public/uploads to public_html/uploads
      const targetPath = publicHtmlUploadsDir;
      fs.symlinkSync(targetPath, localUploadsDir, "dir");
      console.log(`[Symlink] Created symlink successfully: ${localUploadsDir} -> ${targetPath}`);
    }
  } catch (err) {
    console.error("[Symlink] Error in ensureUploadsSymlink:", err);
  }
}
