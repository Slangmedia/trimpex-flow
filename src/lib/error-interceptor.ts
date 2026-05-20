import fs from "fs";
import path from "path";

// Keep a reference to the original console.error to avoid circular logging
const originalConsoleError = console.error;

interface PendingError {
  message: string;
  stack?: string;
  timestamp: number;
}

// Global process-level cache for matching errors with separate digest log printouts
const GLOBAL_ERRORS_KEY = Symbol.for("3dflow.error_interceptor.errors");
const globalSymbols = global as any;
if (!globalSymbols[GLOBAL_ERRORS_KEY]) {
  globalSymbols[GLOBAL_ERRORS_KEY] = [];
}
const lastErrors: PendingError[] = globalSymbols[GLOBAL_ERRORS_KEY];

// Periodically clean up old cached errors to avoid memory leaks
if (!globalSymbols[Symbol.for("3dflow.error_interceptor.cleanup")]) {
  globalSymbols[Symbol.for("3dflow.error_interceptor.cleanup")] = setInterval(() => {
    const now = Date.now();
    const len = lastErrors.length;
    // Keep items from the last 15 seconds
    const filtered = lastErrors.filter((e) => now - e.timestamp < 15000);
    lastErrors.length = 0;
    lastErrors.push(...filtered);
  }, 30000);
}

function saveErrorDetails(digest: string, message: string, stack?: string) {
  try {
    const dir = path.join(process.cwd(), "public", "errors");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${digest}.json`);
    
    // Avoid re-writing the same digest if it's already logged
    if (fs.existsSync(filePath)) {
      return;
    }

    const data = {
      digest,
      message,
      stack,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    originalConsoleError(`[ERROR_INTERCEPTOR] Logged error digest ${digest} to: ${filePath}`);
  } catch (e) {
    originalConsoleError("[ERROR_INTERCEPTOR] Failed to save error details to disk:", e);
  }
}

// Override console.error only once
const OVERRIDE_FLAG = Symbol.for("3dflow.error_interceptor.overridden");
if (!globalSymbols[OVERRIDE_FLAG]) {
  globalSymbols[OVERRIDE_FLAG] = true;

  console.error = function (...args: any[]) {
    // Invoke the original console.error first
    originalConsoleError.apply(console, args);

    try {
      let foundError: Error | null = null;
      let foundDigest: string | null = null;

      for (const arg of args) {
        if (arg && typeof arg === "object") {
          // Check if it's an Error instance or has Error-like properties
          if (arg instanceof Error) {
            foundError = arg;
            if ((arg as any).digest) {
              foundDigest = (arg as any).digest;
            }
          } else if (arg.message && (arg.stack || arg.name)) {
            // Error-like plain object sometimes printed by bundlers
            foundError = arg as Error;
            if ((arg as any).digest) {
              foundDigest = (arg as any).digest;
            }
          }
        } else if (typeof arg === "string") {
          // Look for Next.js digest formats in string printouts:
          // e.g. "Digest: 1837025358" or "digest: '1837025358'"
          const digestMatch =
            arg.match(/digest:\s*['"]?([a-zA-Z0-9_-]+)['"]?/i) ||
            arg.match(/Digest:\s*([a-zA-Z0-9_-]+)/);
          if (digestMatch && digestMatch[1]) {
            foundDigest = digestMatch[1];
          }
        }
      }

      if (foundError) {
        if (foundDigest) {
          saveErrorDetails(foundDigest, foundError.message, foundError.stack);
        } else {
          // Cache the error. React often logs the stack trace in one console.error,
          // and a separate message containing the digest in a subsequent call.
          lastErrors.push({
            message: foundError.message,
            stack: foundError.stack,
            timestamp: Date.now(),
          });
        }
      } else if (foundDigest) {
        // We found a digest. Attempt to associate it with the most recent error
        // logged in the last 3 seconds.
        const now = Date.now();
        // Search from newest to oldest
        for (let i = lastErrors.length - 1; i >= 0; i--) {
          const err = lastErrors[i];
          if (now - err.timestamp < 3000) {
            saveErrorDetails(foundDigest, err.message, err.stack);
            break;
          }
        }
      }
    } catch (e) {
      originalConsoleError("[ERROR_INTERCEPTOR] Error inside console.error override:", e);
    }
  };
}
