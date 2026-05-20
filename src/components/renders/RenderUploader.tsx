"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, FileImage, FileVideo, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RenderUploaderProps {
  renderItemId: string;
  onSuccess?: () => void;
}

type FileWithPreview = {
  file: File;
  preview: string;
  type: "IMAGE" | "VIDEO";
};

export function RenderUploader({ renderItemId, onSuccess }: RenderUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video file.");
      return;
    }

    // Clean up previous preview if exists
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }

    setSelectedFile({
      file,
      preview: URL.createObjectURL(file),
      type: isImage ? "IMAGE" : "VIDEO",
    });
    setError(null);
    setIsSuccess(false);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [selectedFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    setError(null);
    setIsSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Mock Cloud Upload (Simulating a delay and returning a fake URL)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // For development, we use the images provided by the user in public/uploads
      const devImages = [
        "plitka-1xsale-artcer-44840.jpg",
        "plitka-cement-artcer-37.png",
        "plitka-ethereal-ibero-46510_1.png",
        "plitka-marble-artcer-24077_14.jpg",
        "plitka-marble-artcer-24077_7.jpg"
      ];
      
      const randomImage = devImages[Math.floor(Math.random() * devImages.length)];
      const mockFileUrl = selectedFile.type === "IMAGE" 
        ? `/uploads/${randomImage}` 
        : "https://storage.3dflow.com/renders/mock-video.mp4";

      // 2. API Call to backend
      const response = await fetch("/api/renders/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderItemId,
          fileUrl: mockFileUrl,
          fileType: selectedFile.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload render");
      }

      setIsSuccess(true);
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden border-dashed border-2">
      <CardContent className="p-6">
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-muted/30",
              "hover:bg-muted/50 hover:border-primary/50"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="p-4 mb-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <p className="mb-2 text-sm font-semibold">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Images (JPG, PNG, WEBP) or Videos (MP4, WEBM)
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              {selectedFile.type === "IMAGE" ? (
                <img
                  src={selectedFile.preview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={selectedFile.preview}
                  controls
                  className="max-w-full max-h-full"
                />
              )}
              
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearFile}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Overlay delete button that's always visible for better UX on mobile */}
              <button 
                onClick={clearFile}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.type === "IMAGE" ? (
                  <FileImage className="w-4 h-4 text-primary" />
                ) : (
                  <FileVideo className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.file.name}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile} disabled={isUploading}>
                Change File
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        {isSuccess && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Render submitted successfully!
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="w-full h-12 text-base font-semibold transition-all shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Render...
              </>
            ) : (
              "Submit Render"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
