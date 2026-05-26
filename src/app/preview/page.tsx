"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function PreviewContent() {
  const searchParams = useSearchParams();
  const rawImageUrl = searchParams.get("url");

  const imageUrl = rawImageUrl;

  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when URL changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setHasError(false);
  }, [rawImageUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Sensitivity factor
      const zoomFactor = 0.08;
      setScale(s => {
        if (e.deltaY < 0) {
          return Math.min(8, s + zoomFactor);
        } else {
          return Math.max(0.25, s - zoomFactor);
        }
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  if (!imageUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-muted-foreground">
        No image URL provided
      </div>
    );
  }

  const isVideoUrl = (url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const pathname = parsed.pathname.toLowerCase();
      return (
        pathname.endsWith(".mp4") ||
        pathname.endsWith(".webm") ||
        pathname.endsWith(".ogg") ||
        pathname.endsWith(".mov")
      );
    } catch (e) {
      const lower = url.toLowerCase();
      return (
        lower.includes(".mp4") ||
        lower.includes(".webm") ||
        lower.includes(".ogg") ||
        lower.includes(".mov")
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasError) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || hasError) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(s => Math.min(8, s + 0.25));
  };

  const handleZoomOut = () => {
    setScale(s => Math.max(0.25, s - 0.25));
  };

  return (
    <div 
      className="h-screen w-screen bg-neutral-950 flex flex-col justify-between overflow-hidden relative select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header bar */}
      <div className="w-full bg-neutral-900/90 border-b border-neutral-800 p-4 flex justify-between items-center z-10">
        <span className="text-white font-medium truncate text-sm">
          Image Preview ({Math.round(scale * 100)}%)
        </span>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleZoomOut}
            disabled={hasError}
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700 disabled:opacity-50"
          >
            <ZoomOut className="h-4 w-4 mr-1.5" /> Zoom Out
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleReset}
            disabled={hasError}
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleZoomIn}
            disabled={hasError}
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700 disabled:opacity-50"
          >
            <ZoomIn className="h-4 w-4 mr-1.5" /> Zoom In
          </Button>
        </div>
      </div>

      {/* Panning and Zooming container */}
      <div 
        ref={containerRef}
        className={`flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950 ${
          hasError ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
        onMouseDown={handleMouseDown}
      >
        {hasError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Failed to load preview</h3>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              We couldn't load the file from <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-neutral-300 break-all text-xs font-mono">{rawImageUrl}</code>.
              <br />
              <span className="mt-2 block text-xs text-neutral-500">
                If this file was uploaded before the latest deployment, it may need to be synchronized to the static directory.
              </span>
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => {
                  setHasError(false);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white w-full border border-neutral-700"
              >
                Retry Loading
              </Button>
              <a 
                href="/admin/dashboard"
                className="text-neutral-400 hover:text-white text-xs py-2 transition-colors text-center"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        ) : isVideoUrl(rawImageUrl || "") ? (
          <video 
            src={imageUrl} 
            controls 
            onError={() => setHasError(true)}
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
            className="max-w-[85vw] max-h-[85vh] object-contain shadow-2xl origin-center"
          />
        ) : (
          <img 
            src={imageUrl} 
            alt="Preview" 
            onError={() => setHasError(true)}
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              pointerEvents: "none"
            }}
            className="max-w-[85vw] max-h-[85vh] object-contain shadow-2xl origin-center"
          />
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-white font-mono">
        Loading preview...
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
