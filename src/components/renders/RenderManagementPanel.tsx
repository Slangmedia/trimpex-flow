"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  History, 
  Upload, 
  FileVideo,
  Clock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RenderUploader } from "./RenderUploader";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RenderManagementPanelProps {
  renderItemId: string;
  userRole: "ADMIN" | "EMPLOYEE";
}

interface Version {
  id: string;
  version_number: number;
  file_url: string;
  file_type: "IMAGE" | "VIDEO";
  submitted_at: string;
  is_current_version: boolean;
  admin_action: "APPROVED" | "REJECTED" | null;
  admin_note: string | null;
  submittedBy: {
    name: string;
    avatar_url: string | null;
  };
}

interface RenderItem {
  id: string;
  name: string;
  sku_code: string;
  current_status: string;
  current_version: number;
  versions: Version[];
  project: {
    name: string;
    client: { name: string };
  };
}

export function RenderManagementPanel({ renderItemId, userRole }: RenderManagementPanelProps) {
  const [data, setData] = useState<RenderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<Version | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/renders/${renderItemId}`);
      const json = await res.json();
      setData(json);
      // Set active version to the current one initially
      const current = json.versions.find((v: Version) => v.is_current_version);
      setActiveVersion(current || json.versions[0]);
    } catch (err) {
      console.error("Failed to fetch render data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [renderItemId]);

  const handleDecision = async (action: "APPROVE" | "REJECT") => {
    if (!activeVersion) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/renders/${renderItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note,
          versionId: activeVersion.id,
        }),
      });
      if (res.ok) {
        await fetchData();
        setNote("");
      }
    } catch (err) {
      console.error("Failed to process decision", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading Render Panel...</p>
        </div>
      </div>
    );
  }

  if (!data || !activeVersion) return <div>Render not found.</div>;

  const canApprove = userRole === "ADMIN" && data.current_status === "SUBMITTED";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto p-4">
      {/* LEFT COLUMN: PREVIEW & CONTROLS (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {data.name}
                  <Badge variant="outline" className="text-xs font-mono uppercase">
                    {data.sku_code}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {data.project.client.name} • {data.project.name}
                </CardDescription>
              </div>
              <Badge 
                className={cn(
                  "px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                  data.current_status === "SUBMITTED" && "bg-blue-500/20 text-blue-500",
                  data.current_status === "CLIENT_PENDING" && "bg-amber-500/20 text-amber-500",
                  data.current_status === "COMPLETE" && "bg-emerald-500/20 text-emerald-500",
                  data.current_status === "ADMIN_REJECTED" && "bg-red-500/20 text-red-500"
                )}
              >
                {data.current_status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* LARGE PREVIEW */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-none">
                  V{activeVersion.version_number}
                </Badge>
              </div>
              {activeVersion.file_type === "IMAGE" ? (
                <img 
                  src={activeVersion.file_url} 
                  alt={data.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video 
                  src={activeVersion.file_url} 
                  controls 
                  className="w-full h-full"
                />
              )}
            </div>

            {/* ADMIN DECISION PANEL */}
            {canApprove && (
              <div className="p-6 bg-muted/30 border-t border-border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Reviewing V{activeVersion.version_number}
                </h4>
                <textarea
                  placeholder="Add a review note (optional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-all mb-4"
                />
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleDecision("APPROVE")}
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Send to Client
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDecision("REJECT")}
                    disabled={isProcessing}
                    className="flex-1 shadow-lg shadow-red-600/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Revision
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UPLOADER SECTION (Always visible for Employees, or after rejection) */}
        {(userRole === "EMPLOYEE" || data.current_status === "ADMIN_REJECTED") && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-2">
              <Upload className="w-5 h-5" />
              Upload New Version
            </h3>
            <RenderUploader 
              renderItemId={renderItemId} 
              onSuccess={() => fetchData()} 
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: MEDIA MANAGE / HISTORY (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Version History
            </CardTitle>
            <CardDescription>
              {data.versions.length} versions submitted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {data.versions.map((v) => (
                <div 
                  key={v.id}
                  onClick={() => setActiveVersion(v)}
                  className={cn(
                    "group relative p-3 rounded-xl border transition-all cursor-pointer overflow-hidden",
                    activeVersion.id === v.id 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-lg bg-black overflow-hidden flex-shrink-0">
                      {v.file_type === "IMAGE" ? (
                        <img src={v.file_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <FileVideo className="w-6 h-6" />
                        </div>
                      )}
                      {v.is_current_version && (
                        <Badge className="absolute bottom-1 right-1 px-1 py-0 text-[8px] bg-primary text-primary-foreground">
                          CURRENT
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold">Version {v.version_number}</span>
                        {v.admin_action === "APPROVED" && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                        {v.admin_action === "REJECTED" && <XCircle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <User className="w-3 h-3" />
                        {v.submittedBy.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(v.submitted_at), "MMM d, h:mm a")}
                      </div>
                      
                      {v.admin_note && (
                        <p className="text-[10px] italic mt-2 text-muted-foreground line-clamp-1 border-l-2 border-primary/30 pl-2">
                          &quot;{v.admin_note}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
