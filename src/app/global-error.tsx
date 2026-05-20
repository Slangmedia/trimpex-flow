"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Terminal, Copy, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import "@/app/globals.css"; // Ensure globals are imported for global-error fallback

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface SavedError {
  digest: string;
  message: string;
  stack?: string;
  timestamp: string;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorDetails, setErrorDetails] = useState<SavedError | null>(null);

  useEffect(() => {
    console.error("GlobalErrorBoundary caught root layout error:", error);

    if (error.digest) {
      setLoading(true);
      fetch(`/errors/${error.digest}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not find logged error");
          return res.json() as Promise<SavedError>;
        })
        .then((data) => {
          setErrorDetails(data);
        })
        .catch((err) => {
          console.warn("Could not retrieve detailed server-side logs for digest:", error.digest, err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [error]);

  const handleCopy = () => {
    const detailsText = errorDetails 
      ? `Digest: ${errorDetails.digest}\nMessage: ${errorDetails.message}\nStack: ${errorDetails.stack || "N/A"}`
      : `Digest: ${error.digest || "N/A"}\nMessage: ${error.message}`;
    
    navigator.clipboard.writeText(detailsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background Premium Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <Card className="w-full max-w-xl border-slate-800/80 bg-slate-900/60 backdrop-blur-xl text-slate-100 shadow-2xl relative z-10 overflow-hidden">
          {/* Decorative Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
          
          <CardHeader className="text-center pb-4 pt-8">
            <div className="mx-auto w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/5 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-50">
              Critical System Exception
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm mt-1 max-w-md mx-auto leading-relaxed">
              A critical root-level error occurred. The application has logged the event details.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 sm:px-8">
            {/* Main Error Presentation */}
            <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-4 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Error Code / Digest
                  </span>
                  <code className="text-sm font-mono text-amber-400 selection:bg-amber-500/20">
                    {error.digest || "Unknown Digest"}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy Info"}
                </Button>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Visible Error Message
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {errorDetails ? errorDetails.message : error.message}
                </p>
              </div>
            </div>

            {/* Detailed Developer Panel */}
            {error.digest && (
              <div className="border border-slate-800/60 rounded-lg overflow-hidden bg-slate-950/20">
                <Button
                  variant="ghost"
                  className="w-full justify-between h-11 px-4 text-slate-300 hover:bg-slate-900/40 hover:text-slate-100 rounded-none transition-colors border-b border-slate-800/40"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Terminal className="h-4 w-4 text-amber-500" />
                    Developer Details (Unmasked)
                  </span>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </Button>

                {showDetails && (
                  <div className="p-4 bg-slate-950 text-slate-400 font-mono text-xs overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap border-t border-slate-900 selection:bg-slate-800 selection:text-slate-100">
                    {loading ? (
                      <div className="flex items-center gap-2 text-slate-500 py-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Retrieving unmasked production logs...
                      </div>
                    ) : errorDetails ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-emerald-500 font-bold block mb-1"># SERVER EXCEPTION:</span>
                          <span className="text-slate-200">{errorDetails.message}</span>
                        </div>
                        {errorDetails.stack && (
                          <div>
                            <span className="text-red-400 font-bold block mb-1"># STACK TRACE:</span>
                            <span className="text-slate-400">{errorDetails.stack}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-600 border-t border-slate-900 pt-2 flex justify-between">
                          <span>Captured: {new Date(errorDetails.timestamp).toLocaleString()}</span>
                          <span>Logged locally</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 py-1 flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Detailed logs not available for this digest yet. This might happen if the error occurred on a different server instance, or before the filesystem synced.
                          <br />
                          <span className="text-slate-600 mt-2 block font-sans">
                            Check server terminal or PM2 logs for Digest: <strong className="font-mono text-amber-500/80">{error.digest}</strong>
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 pb-8 px-6 sm:px-8 border-t border-slate-900/60 mt-4">
            <Button
              onClick={() => reset()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium shadow-md shadow-red-950/20"
            >
              <RefreshCw className="h-4 w-4" />
              Reload & Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="w-full sm:w-auto border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
            >
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </body>
    </html>
  );
}
