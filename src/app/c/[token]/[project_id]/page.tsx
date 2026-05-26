"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, RotateCcw, MessageSquare, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill, RenderStatus } from "@/components/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const projectsData: Record<string, { name: string, clientName: string, renders: any[] }> = {
  "1": {
    name: "Spring Collection 2026",
    clientName: "Acme Corp",
    renders: [
      { id: "r1", name: "Living Room Angle 1", sku: "LR-001", version: 2, status: "CLIENT_PENDING" as RenderStatus, thumbnail: "" },
      { id: "r2", name: "Kitchen View", sku: "KT-005", version: 1, status: "CLIENT_PENDING" as RenderStatus, thumbnail: "" },
      { id: "r3", name: "Bedroom Close-up", sku: "BD-002", version: 3, status: "COMPLETE" as RenderStatus, thumbnail: "" },
      { id: "r4", name: "Bathroom Mirror", sku: "BT-001", version: 1, status: "REJECTED" as RenderStatus, clientFeedback: "The reflection looks unnatural. Please adjust lighting.", thumbnail: "" },
      { id: "r5", name: "Patio Wide", sku: "PT-009", version: 2, status: "REVISION_REQUIRED" as RenderStatus, clientFeedback: "Needs more sunlight on the left wall.", thumbnail: "" },
    ]
  },
  "2": {
    name: "Mark V Renders",
    clientName: "Stark Industries",
    renders: [
      { id: "r1", name: "Helmet Interface Faceplate", sku: "MK5-H1", version: 1, status: "CLIENT_PENDING" as RenderStatus, thumbnail: "" },
      { id: "r2", name: "Chest Arc Reactor Integration", sku: "MK5-R1", version: 2, status: "COMPLETE" as RenderStatus, thumbnail: "" },
      { id: "r3", name: "Left Forearm Repulsor Assembly", sku: "MK5-F2", version: 1, status: "REJECTED" as RenderStatus, clientFeedback: "Armor alignment on outer shell looks offset by 2mm.", thumbnail: "" },
    ]
  },
  "3": {
    name: "T-800 Endoskeleton Renders",
    clientName: "Cyberdyne Systems",
    renders: [
      { id: "r1", name: "T-800 Neural Net CPU Architecture", sku: "T8-CPU", version: 2, status: "CLIENT_PENDING" as RenderStatus, thumbnail: "" },
      { id: "r2", name: "Chassis Torso Front Assembly", sku: "T8-CHS", version: 1, status: "CLIENT_PENDING" as RenderStatus, thumbnail: "" },
      { id: "r3", name: "Hydraulic Leg Actuators", sku: "T8-LEG", version: 3, status: "COMPLETE" as RenderStatus, thumbnail: "" },
      { id: "r4", name: "Endoskeleton Skull Jaw articulation", sku: "T8-SKL", version: 1, status: "REJECTED" as RenderStatus, clientFeedback: "The chromium polish reflections are too sharp under overhead spots.", thumbnail: "" }
    ]
  }
};

export default function ClientRenderGallery({ params }: { params: { token: string, project_id: string } }) {
  const [project, setProject] = useState({ id: params.project_id, name: "Loading...", clientName: "Loading..." });
  const [renders, setRenders] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [renderToReject, setRenderToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedRender, setSelectedRender] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  const handleCloseDetailModal = () => {
    setSelectedRender(null);
    setSelectedVersion(null);
  };

  useEffect(() => {
    async function loadPortalProject() {
      try {
        const res = await fetch(`/api/client-portal/${params.token}/${params.project_id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
          setRenders(data.renders);
        }
      } catch (e) {
        console.error("Failed to load client project renders", e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadPortalProject();
  }, [params.token, params.project_id]);

  const pendingCount = renders.filter(r => r.status === "CLIENT_PENDING").length;
  const approvedCount = renders.filter(r => r.status === "COMPLETE").length;
  const rejectedCount = renders.filter(r => r.status === "REJECTED" || r.status === "REVISION_REQUIRED" || r.status === "REVISION_PENDING").length;

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/client-portal/${params.token}/${params.project_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId: id, action: "APPROVE" })
      });
      if (res.ok) {
        setRenders(renders.map(r => r.id === id ? { ...r, status: "COMPLETE" } : r));
      }
    } catch (err) {
      console.error("Failed to approve render:", err);
    }
  };

  const handleNeedChangesClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveFeedbackId(activeFeedbackId === id ? null : id);
    setFeedbackText("");
  };

  const handleSubmitFeedback = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (feedbackText.trim().length < 10) return;
    try {
      const res = await fetch(`/api/client-portal/${params.token}/${params.project_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId: id, action: "CHANGES", feedback: feedbackText })
      });
      if (res.ok) {
        setRenders(renders.map(r => r.id === id ? { ...r, status: "REVISION_REQUIRED", clientFeedback: feedbackText } : r));
        setActiveFeedbackId(null);
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleRejectClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRenderToReject(id);
    setRejectReason("");
    setErrorMsg("");
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!renderToReject || rejectReason.length < 10) return;
    setErrorMsg("");
    try {
      const res = await fetch(`/api/client-portal/${params.token}/${params.project_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId: renderToReject, action: "REJECT", feedback: rejectReason })
      });
      if (res.ok) {
        setRenders(renders.map(r => r.id === renderToReject ? { ...r, status: "REJECTED", clientFeedback: rejectReason } : r));
        setIsRejectModalOpen(false);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to reject render. Please check the feedback and try again.");
      }
    } catch (err) {
      console.error("Failed to reject render:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  const renderCard = (render: typeof renders[0]) => (
    <Card 
      key={render.id} 
      className="flex flex-col overflow-hidden transition-all p-0 pt-0 pb-0 cursor-pointer hover:border-foreground/20 group h-full"
      onClick={() => setSelectedRender(render)}
    >
      <div className="aspect-[4/3] bg-muted relative border-b border-border overflow-hidden">
        {render.thumbnail ? (
          <img src={render.thumbnail} alt={render.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-muted-foreground font-medium">
            No Preview Available
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="font-mono bg-primary/80 text-primary-foreground shadow-sm backdrop-blur-sm rounded-[4px]">
            V{render.version}
          </Badge>
        </div>
        {(render.status === "REVISION_REQUIRED" || render.status === "REVISION_PENDING") && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
            <Badge className="bg-status-revision text-status-revision-foreground border-transparent">Revision Pending</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="font-medium truncate text-sm flex-1">{render.name}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
            onClick={async (e) => {
              e.stopPropagation();
              const url = render.thumbnail || render.fileUrl;
              if (url) {
                try {
                  const res = await fetch(url);
                  if (!res.ok) throw new Error("Failed to fetch file");
                  const blob = await res.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  const ext = url.split('.').pop() || 'png';
                  const cleanName = render.name.toLowerCase().endsWith(`.${ext}`)
                    ? render.name
                    : `${render.name}.${ext}`;
                  a.download = cleanName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  console.error("Client-side download failed, falling back:", err);
                  window.open(url, "_blank");
                }
              }
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="mt-auto">
          <div className="flex flex-col gap-2">
            <StatusPill status={render.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <Link href={`/c/${params.token}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{project.name}</h1>
          </div>
        </div>
        <div className="text-sm font-medium hidden sm:block">
          <span className="text-muted-foreground mr-1">Approved:</span>
          {approvedCount} of {renders.length}
        </div>
      </header>
      
      <main className="flex-1 w-full p-5">
        <Tabs defaultValue="all" className="w-full">
          <div className="sticky top-16 bg-background pt-2 pb-4 z-10 border-b border-border mb-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex bg-muted/50 border border-border rounded-xl p-1 h-auto gap-1">
              <TabsTrigger
                value="all"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-foreground hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                All
                <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                  {renders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-amber-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Pending
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-amber-100 text-amber-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-emerald-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Approved
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                  {approvedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-rose-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Rejected
                {rejectedCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-rose-100 text-rose-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {rejectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0 outline-none">
            {renders.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No renders yet</h3>
                <p className="text-muted-foreground mt-1">There are no renders released for review.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {renders.map(r => renderCard(r))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0 outline-none">
            {pendingCount === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground mt-1">There are no renders waiting for your review.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {renders.filter(r => r.status === "CLIENT_PENDING").map(r => renderCard(r))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renders.filter(r => r.status === "COMPLETE").map(r => renderCard(r))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renders.filter(r => r.status === "REJECTED" || r.status === "REVISION_REQUIRED" || r.status === "REVISION_PENDING").map(r => renderCard(r))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reject this render?</DialogTitle>
            <DialogDescription>
              Please let us know why — your feedback helps us improve the submission.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for rejection *</label>
              <Textarea 
                placeholder="e.g. The texture on the sofa looks incorrect..."
                className="min-h-[100px]"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              {rejectReason.length > 0 && rejectReason.length < 10 && (
                <p className="text-xs text-destructive">Please provide at least 10 characters.</p>
              )}
              {errorMsg && (
                <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 mt-2">{errorMsg}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmReject}
              disabled={rejectReason.length < 10}
            >
              Reject Render
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Render Detail Modal */}
      <Dialog open={!!selectedRender} onOpenChange={(open) => !open && handleCloseDetailModal()}>
        <DialogContent className="max-w-[100vw] h-[100dvh] sm:h-[80vh] sm:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col sm:rounded-xl w-full sm:w-[95vw]">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-background pr-10">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono bg-accent text-accent-foreground rounded-[4px]">
                V{selectedVersion ? selectedVersion.versionNumber : (selectedRender?.currentVersion || selectedRender?.version || 1)}
              </Badge>
              <h2 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{selectedRender?.name}</h2>
              {selectedRender && <StatusPill status={selectedRender.currentStatus || selectedRender.status || "SUBMITTED"} className="hidden sm:inline-flex" />}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row bg-muted/30 h-full">
            {/* Preview Area */}
            <div className="flex-1 min-h-[40vh] sm:min-h-0 bg-black flex items-center justify-center relative group h-full">
              {(selectedVersion?.fileUrl || selectedRender?.thumbnail) ? (
                <>
                  {(() => {
                    const fileUrl = selectedVersion?.fileUrl || selectedRender?.thumbnail;
                    const fileType = selectedVersion ? selectedVersion.fileType : selectedRender?.fileType;
                    const isVideo = fileType === "VIDEO" || 
                      (fileUrl && (
                        fileUrl.toLowerCase().endsWith(".mp4") || 
                        fileUrl.toLowerCase().endsWith(".webm") || 
                        fileUrl.toLowerCase().endsWith(".ogg") || 
                        fileUrl.toLowerCase().endsWith(".mov")
                      ));
                    return isVideo ? (
                      <video 
                        src={fileUrl} 
                        controls 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={fileUrl} 
                        alt={selectedRender?.name} 
                        className="w-full h-full object-contain" 
                      />
                    );
                  })()}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/85 text-white border-transparent"
                    onClick={() => {
                      const imageUrl = selectedVersion?.fileUrl || selectedRender?.thumbnail;
                      if (imageUrl) {
                        window.open(`/preview?url=${encodeURIComponent(imageUrl)}`, '_blank');
                      }
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <span className="text-muted-foreground">No Preview Available</span>
              )}
            </div>
            
            {/* Sidebar Details */}
            <div className="w-full sm:w-[350px] bg-background border-t sm:border-t-0 sm:border-l border-border shrink-0 flex flex-col h-full overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 h-full space-y-6">
                {selectedRender?.status === "CLIENT_PENDING" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        onClick={(e) => handleApprove(e, selectedRender.id)}
                      >
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`flex-1 font-semibold ${activeFeedbackId === selectedRender.id ? "bg-status-revision text-status-revision-foreground border-transparent" : ""}`}
                        onClick={(e) => handleNeedChangesClick(e, selectedRender.id)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" /> Changes
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-destructive hover:bg-destructive/10 border-border font-semibold"
                        onClick={(e) => handleRejectClick(e, selectedRender.id)}
                      >
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                    
                    {activeFeedbackId === selectedRender.id && (
                      <div className="pt-3 border-t border-border animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                        <Textarea 
                          placeholder="Describe what needs to be changed..." 
                          className="min-h-[80px] text-sm mb-2 bg-muted/50 border-border/60 focus-visible:ring-status-revision"
                          maxLength={500}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">{feedbackText.length}/500</span>
                            {feedbackText.trim().length > 0 && feedbackText.trim().length < 10 && (
                              <span className="text-[10px] text-destructive">At least 10 characters required.</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-status-revision hover:bg-status-revision/90 text-status-revision-foreground"
                            onClick={(e) => handleSubmitFeedback(e, selectedRender.id)}
                            disabled={feedbackText.trim().length < 10}
                          >
                            Submit Feedback
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Revision History</h3>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-px before:bg-border">
                    {selectedRender?.versionsHistory?.map((v: any) => {
                    const isSelected = selectedVersion ? (selectedVersion.id === v.id) : (v.versionNumber === selectedRender.version);
                    return (
                      <div 
                        key={v.id} 
                        className={`relative flex gap-4 cursor-pointer p-2 -ml-2 rounded-lg transition-all duration-150 ${
                          isSelected ? "bg-accent/60 border border-border" : "hover:bg-muted border border-transparent"
                        }`}
                        onClick={() => setSelectedVersion(v)}
                      >
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 mt-0.5 transition-all duration-150 ${
                          isSelected 
                            ? "border-primary bg-primary text-primary-foreground font-bold" 
                            : "border-border bg-background text-muted-foreground"
                        }`}>
                          <span className="text-[11px]">V{v.versionNumber}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm flex items-center justify-between">
                            <span>Version {v.versionNumber}</span>
                            {v.versionNumber === selectedRender.version && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30 text-primary bg-primary/5">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 mb-2">Submitted {v.submittedAt}</div>
                          <div className="bg-card border border-border rounded-md p-3 text-xs leading-relaxed">
                            {v.clientAction === "APPROVED" && <div className="font-semibold text-emerald-600">✓ Client Approved</div>}
                            {v.clientAction === "REJECTED" && <div className="font-semibold text-rose-600 mb-1">✕ Client Rejected</div>}
                            {v.clientAction === "CHANGES_REQUESTED" && <div className="font-semibold text-amber-600 mb-1">⟳ Changes Requested</div>}
                            {!v.clientAction && <div className="font-semibold text-status-pending-foreground">Pending Client Review</div>}
                            
                            {v.clientFeedback && (
                              <p className="italic text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                                "{v.clientFeedback}"
                              </p>
                            )}
                            {v.adminNote && (
                              <p className="text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                                <span className="font-medium text-foreground">Admin Note:</span> "{v.adminNote}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
