"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function PreviewContent() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("url");
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when URL changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
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
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700"
          >
            <ZoomOut className="h-4 w-4 mr-1.5" /> Zoom Out
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleReset}
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleZoomIn}
            className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700"
          >
            <ZoomIn className="h-4 w-4 mr-1.5" /> Zoom In
          </Button>
        </div>
      </div>

      {/* Panning and Zooming container */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-neutral-950"
        onMouseDown={handleMouseDown}
      >
        <img 
          src={imageUrl} 
          alt="Preview" 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            pointerEvents: "none"
          }}
          className="max-w-[85vw] max-h-[85vh] object-contain shadow-2xl origin-center"
        />
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
