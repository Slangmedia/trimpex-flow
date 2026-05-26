import fs from "fs";
import path from "path";

export function ensureUploadsSymlink() {
  // No-op: we do not use symlinks to prevent git pull/push from deleting uploaded assets.
  return;
}

