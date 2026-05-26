"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, UploadCloud, Check, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill, RenderStatus } from "@/components/StatusPill";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const projectsData: Record<string, { name: string, clientName: string, deadline: string, renders: any[] }> = {
  "1": {
    name: "Spring Collection 2026",
    clientName: "Acme Corp",
    deadline: "2026-06-01",
    renders: [
      { id: "r1", name: "Living Room Angle 1", sku: "LR-001", version: 2, status: "SUBMITTED" as RenderStatus, date: "10 mins ago" },
      { id: "r2", name: "Kitchen View", sku: "KT-005", version: 1, status: "CLIENT_PENDING" as RenderStatus, date: "2 hours ago" },
      { id: "r3", name: "Bedroom Close-up", sku: "BD-002", version: 3, status: "COMPLETE" as RenderStatus, date: "1 day ago" },
      { id: "r4", name: "Bathroom Mirror", sku: "BT-001", version: 1, status: "REJECTED" as RenderStatus, date: "3 days ago", clientFeedback: "The reflection looks unnatural. Please adjust lighting." },
      { id: "r5", name: "Patio Wide", sku: "PT-009", version: 1, status: "ADMIN_REJECTED" as RenderStatus, date: "4 days ago", adminNote: "Missing the requested prop on the table." },
    ]
  },
  "2": {
    name: "Mark V Renders",
    clientName: "Stark Industries",
    deadline: "2026-05-10",
    renders: [
      { id: "r1", name: "Helmet Interface Faceplate", sku: "MK5-H1", version: 1, status: "CLIENT_PENDING" as RenderStatus, date: "30 mins ago" },
      { id: "r2", name: "Chest Arc Reactor Integration", sku: "MK5-R1", version: 2, status: "COMPLETE" as RenderStatus, date: "1 day ago" },
      { id: "r3", name: "Left Forearm Repulsor Assembly", sku: "MK5-F2", version: 1, status: "REJECTED" as RenderStatus, date: "2 days ago", clientFeedback: "Armor alignment looks offset." },
    ]
  },
  "3": {
    name: "T-800 Endoskeleton Renders",
    clientName: "Cyberdyne Systems",
    deadline: "2026-08-29",
    renders: [
      { id: "r1", name: "T-800 Neural Net CPU Architecture", sku: "T8-CPU", version: 2, status: "CLIENT_PENDING" as RenderStatus, date: "5 mins ago" },
      { id: "r2", name: "Chassis Torso Front Assembly", sku: "T8-CHS", version: 1, status: "CLIENT_PENDING" as RenderStatus, date: "1 hour ago" },
      { id: "r3", name: "Hydraulic Leg Actuators", sku: "T8-LEG", version: 3, status: "COMPLETE" as RenderStatus, date: "1 day ago" },
      { id: "r4", name: "Endoskeleton Skull Jaw articulation", sku: "T8-SKL", version: 1, status: "REJECTED" as RenderStatus, date: "2 days ago", clientFeedback: "The reflections are too sharp." }
    ]
  }
};
interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export default function EmployeeProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState({ id: params.id, name: "Loading...", clientName: "Loading...", deadline: "Loading...", totalRenders: 0 });
  const [renders, setRenders] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isRevisionSheetOpen, setIsRevisionSheetOpen] = useState(false);
  const [selectedRender, setSelectedRender] = useState<any>(null);
  const [detailRender, setDetailRender] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  const handleCloseDetailModal = () => {
    setDetailRender(null);
    setSelectedVersion(null);
  };

  const handleDeleteRender = async (renderId: string) => {
    if (!confirm("Are you sure you want to delete this render? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/renders/${renderId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Remove from list
        setRenders(prev => prev.filter(r => r.id !== renderId));
        // Decrease totalRenders count
        setProject(prev => ({
          ...prev,
          totalRenders: Math.max(0, prev.totalRenders - 1)
        }));
        // Close detail modal
        handleCloseDetailModal();
        alert("Render deleted successfully.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete render.");
      }
    } catch (error) {
      console.error("Error deleting render:", error);
      alert("An unexpected error occurred.");
    }
  };

  // Form states
  const [newRenderName, setNewRenderName] = useState("");
  const [newRenderSku, setNewRenderSku] = useState("");
  const [newRenderNote, setNewRenderNote] = useState("");
  const [newRenderType, setNewRenderType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [revisionNote, setRevisionNote] = useState("");
  const [revisionFile, setRevisionFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const addRenderInputRef = useRef<HTMLInputElement>(null);
  const revisionInputRef = useRef<HTMLInputElement>(null);

  const loadProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject({
          id: data.id,
          name: data.name,
          clientName: data.clientName,
          deadline: data.deadline,
          totalRenders: data.totalRenders
        });
        setRenders(data.renderItems);
      }
    } catch (e) {
      console.error("Failed to load project details", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadProjectDetails();
    
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    
    fetchCurrentUser();
  }, [params.id]);

  const openRevisionSheet = (render: any) => {
    setSelectedRender(render);
    setIsRevisionSheetOpen(true);
  };

  const handleAddRender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRenderName.trim()) return;

    let fileUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
    setIsUploading(true);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          fileUrl = url;
        } else {
          console.error("File upload failed, falling back to preset.");
        }
      }
      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRenderName,
          projectId: params.id,
          fileUrl,
          fileType: "IMAGE",
          renderType: newRenderType
        })
      });
      if (res.ok) {
        const createdRender = await res.json();
        setRenders([createdRender, ...renders]);
        setNewRenderName("");
        setNewRenderSku("");
        setNewRenderNote("");
        setNewRenderType("");
        setSelectedFile(null);
        setIsUploadSheetOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add render.");
      }
    } catch (err) {
      console.error("Error adding render:", err);
      alert("An error occurred while adding the render.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRender) return;

    let fileUrl = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80";
    setIsUploading(true);

    try {
      if (revisionFile) {
        const formData = new FormData();
        formData.append("file", revisionFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          fileUrl = url;
        } else {
          console.error("File upload failed, falling back to preset.");
        }
      }
      const res = await fetch("/api/renders/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderItemId: selectedRender.id,
          fileUrl,
          fileType: "IMAGE"
        })
      });
      if (res.ok) {
        await loadProjectDetails();
        setRevisionNote("");
        setRevisionFile(null);
        setIsRevisionSheetOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit revision.");
      }
    } catch (err) {
      console.error("Error submitting revision:", err);
      alert("An error occurred while submitting revision.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderGrid = (filteredRenders: any[]) => {
    if (filteredRenders.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
          <p className="text-muted-foreground text-sm">No renders found in this category.</p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {filteredRenders.map((render) => {
          const version = render.currentVersion !== undefined ? render.currentVersion : (render.version || 1);
          const sku = render.skuCode || render.sku || "SKU-GEN";
          const status = render.currentStatus || render.status || "SUBMITTED";
          const imageUrl = render.imageUrl || render.file_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

          return (
            <Card 
              key={render.id} 
              className="overflow-hidden hover:border-foreground/20 transition-colors flex flex-col rounded-2xl border-muted-foreground/20 shadow-sm cursor-pointer p-0 gap-0 h-full"
              onClick={() => setDetailRender(render)}
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                <img src={imageUrl} className="w-full h-full object-cover" alt={render.name} />
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="font-mono bg-black/60 text-white hover:bg-black/80 border-none shadow-sm backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-semibold">
                    V{version}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="font-medium text-lg truncate" title={render.name}>{render.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {(render.renderType || render.render_type) && (
                      <span className="inline-flex items-center text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                        {render.renderType || render.render_type}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium">
                      by <strong className="text-slate-800 font-semibold">{render.submittedBy || "Unknown"}</strong>
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <StatusPill 
                    status={status} 
                    adminAction={render.adminAction}
                    clientAction={render.clientAction}
                    className="w-full justify-start py-2.5 px-4 text-[13px] rounded-lg" 
                  />
                </div>
              </CardContent>
              {["REVISION_REQUIRED", "REJECTED", "ADMIN_REJECTED"].includes(status) && (
                <CardFooter className="p-5">
                  <Button 
                    className="w-full bg-status-revision-foreground text-status-revision hover:bg-status-revision-foreground/90"
                    variant="default"
                    onClick={(e) => { e.stopPropagation(); openRevisionSheet(render); }}
                  >
                    Submit Revision
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading Project Details...</p>
      </div>
    );
  }

  const submittedCount = renders.filter(r => (r.currentStatus || r.status) === "SUBMITTED").length;
  const revisionCount = renders.filter(r => (r.currentStatus || r.status) === "REVISION_REQUIRED").length;
  const clientPendingCount = renders.filter(r => (r.currentStatus || r.status) === "CLIENT_PENDING").length;
  const approvedCount = renders.filter(r => (r.currentStatus || r.status) === "COMPLETE").length;
  const rejectedCount = renders.filter(r => ["REJECTED", "ADMIN_REJECTED"].includes(r.currentStatus || r.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/employee/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className="bg-muted text-muted-foreground">{project.clientName}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>Deadline: {project.deadline}</span>
              <span>•</span>
              <span>Total Renders: {project.totalRenders}</span>
            </div>
          </div>
          
          <Dialog open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsUploadSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Render
            </Button>
            <DialogContent className="w-full sm:max-w-xl overflow-y-auto max-h-[90vh] p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Add New Render</DialogTitle>
                <DialogDescription>
                  Upload a new render for this project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRender} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Render Name *</label>
                  <Input 
                    value={newRenderName} 
                    onChange={(e) => setNewRenderName(e.target.value)} 
                    placeholder="e.g. Living Room Front View" 
                    required 
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <select
                    required
                    value={newRenderType}
                    onChange={(e) => setNewRenderType(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <option value="" disabled>Select type...</option>
                    <option value="Full View">Full View</option>
                    <option value="Close Up">Close Up</option>
                    <option value="Creative">Creative</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Upload *</label>
                  <input 
                    type="file" 
                    ref={addRenderInputRef}
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    disabled={isUploading}
                  />
                  <div 
                    onClick={() => {
                      if (!isUploading) {
                        addRenderInputRef.current?.click();
                      }
                    }}
                    className={`relative border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors overflow-hidden ${
                      isUploading ? 'bg-muted/30 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-black animate-spin mb-4" />
                        <p className="text-sm font-bold mb-1 text-black">Uploading Render...</p>
                        <p className="text-xs text-muted-foreground">Please wait while the asset is being uploaded securely</p>
                      </>
                    ) : selectedFile ? (
                      <>
                        <Check className="h-8 w-8 text-status-complete-foreground mb-4" />
                        <p className="text-sm font-bold mb-1 text-status-complete-foreground">File Selected</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-full px-4">{selectedFile.name}</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-1">Click to upload render</p>
                        <p className="text-xs text-slate-400">JPG, PNG, WEBP, MP4 (preset loaded automatically)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsUploadSheetOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUploading || !selectedFile}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Render"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="pt-4">
        <Tabs defaultValue="submitted" className="w-full">
          <div className="bg-background pt-2 pb-4 z-10 border-b border-border mb-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex bg-muted/50 border border-border rounded-xl p-1 h-auto gap-1">
              <TabsTrigger
                value="submitted"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-blue-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Submitted
                {submittedCount > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {submittedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="revision"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-amber-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Revision
                {revisionCount > 0 && (
                  <Badge className="ml-2 bg-amber-100 text-amber-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {revisionCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="client-pending"
                className="group rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all
                  hover:bg-background hover:text-indigo-600 hover:shadow-sm
                  data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
              >
                Pending
                {clientPendingCount > 0 && (
                  <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {clientPendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="complete"
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
                  <Badge className="ml-2 bg-rose-100 text-rose-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {rejectedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submitted" className="mt-0">
            {renderGrid(renders.filter(r => (r.currentStatus || r.status) === "SUBMITTED"))}
          </TabsContent>

          <TabsContent value="revision" className="mt-0">
            {renderGrid(renders.filter(r => (r.currentStatus || r.status) === "REVISION_REQUIRED"))}
          </TabsContent>

          <TabsContent value="client-pending" className="mt-0">
            {renderGrid(renders.filter(r => (r.currentStatus || r.status) === "CLIENT_PENDING"))}
          </TabsContent>

          <TabsContent value="complete" className="mt-0">
            {renderGrid(renders.filter(r => (r.currentStatus || r.status) === "COMPLETE"))}
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            {renderGrid(renders.filter(r => ["REJECTED", "ADMIN_REJECTED"].includes(r.currentStatus || r.status)))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isRevisionSheetOpen} onOpenChange={setIsRevisionSheetOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Submit Revision</DialogTitle>
            <DialogDescription>
              Upload a new version for {selectedRender?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRevision} className="space-y-6 py-2">
            {selectedRender?.clientFeedback && (
               <div className="p-4 bg-status-revision rounded-md border border-status-revision-foreground/20 text-status-revision-foreground text-sm space-y-1">
                 <span className="font-semibold">Client Feedback:</span>
                 <p className="italic">{selectedRender.clientFeedback}</p>
               </div>
            )}
            {selectedRender?.adminNote && (
               <div className="p-4 bg-status-internal rounded-md border border-border text-status-internal-foreground text-sm space-y-1">
                 <span className="font-semibold">Admin Note:</span>
                 <p className="italic">{selectedRender.adminNote}</p>
               </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">New File Upload *</label>
              <input 
                type="file" 
                ref={revisionInputRef}
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setRevisionFile(e.target.files[0]);
                  }
                }}
                disabled={isUploading}
              />
              <div 
                onClick={() => {
                  if (!isUploading) {
                    revisionInputRef.current?.click();
                  }
                }}
                className={`relative border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors overflow-hidden ${
                  isUploading ? 'bg-muted/30 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-black animate-spin mb-4" />
                    <p className="text-sm font-bold mb-1 text-black">Uploading Revision...</p>
                    <p className="text-xs text-muted-foreground">Please wait while the revision is being uploaded securely</p>
                  </>
                ) : revisionFile ? (
                  <>
                    <Check className="h-8 w-8 text-status-complete-foreground mb-4" />
                    <p className="text-sm font-bold mb-1 text-status-complete-foreground">File Selected</p>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-full px-4">{revisionFile.name}</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click to upload revision</p>
                    <p className="text-xs text-slate-400">JPG, PNG, WEBP, MP4 (preset loaded automatically)</p>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note to Admin (Optional)</label>
              <Textarea 
                value={revisionNote} 
                onChange={(e) => setRevisionNote(e.target.value)} 
                placeholder="Explain what was fixed..." 
                disabled={isUploading}
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRevisionSheetOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !revisionFile}
                className="bg-status-revision-foreground text-status-revision hover:bg-status-revision-foreground/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit V${(selectedRender?.currentVersion || selectedRender?.version || 1) + 1}`
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Render Detail Modal */}
      <Dialog open={!!detailRender} onOpenChange={(open) => !open && handleCloseDetailModal()}>
        <DialogContent className="max-w-[100vw] h-[100dvh] sm:h-[80vh] sm:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col sm:rounded-xl w-full sm:w-[95vw]">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-background pr-10">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono bg-accent text-accent-foreground rounded-[4px]">
                V{selectedVersion ? selectedVersion.versionNumber : (detailRender?.currentVersion || detailRender?.version || 1)}
              </Badge>
              <h2 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{detailRender?.name}</h2>
              {detailRender && (
                <StatusPill 
                  status={detailRender.currentStatus || detailRender.status || "SUBMITTED"} 
                  adminAction={detailRender.adminAction}
                  clientAction={detailRender.clientAction}
                  className="hidden sm:inline-flex" 
                />
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row bg-muted/30 h-full">
            {/* Preview Area */}
            <div className="flex-1 min-h-[40vh] sm:min-h-0 bg-black flex items-center justify-center relative group h-full">
              {(selectedVersion?.fileUrl || detailRender?.imageUrl) ? (
                <>
                  {(() => {
                    const fileUrl = selectedVersion?.fileUrl || detailRender?.imageUrl;
                    const fileType = selectedVersion ? selectedVersion.fileType : detailRender?.fileType;
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
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <img 
                        src={fileUrl} 
                        alt={detailRender?.name} 
                        className="w-full h-full object-contain" 
                      />
                    );
                  })()}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/85 text-white border-transparent"
                    onClick={() => {
                      const fileUrl = selectedVersion?.fileUrl || detailRender?.imageUrl;
                      if (fileUrl) {
                        window.open(`/preview?url=${encodeURIComponent(fileUrl)}`, '_blank');
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
              <div className="p-5 overflow-y-auto flex-1 h-full">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Revision History</h3>
                
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-px before:bg-border">
                  {detailRender?.versionsHistory?.map((v: any) => {
                    const isSelected = selectedVersion ? (selectedVersion.id === v.id) : (v.versionNumber === (detailRender.currentVersion || detailRender.version || 1));
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
                            {v.versionNumber === (detailRender.currentVersion || detailRender.version || 1) && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30 text-primary bg-primary/5">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 mb-2">Submitted {v.submittedAt}</div>
                          <div className="bg-card border border-border rounded-md p-3 text-xs leading-relaxed">
                            {v.adminAction === "APPROVED" ? (
                              <div className="font-semibold text-emerald-600 font-medium">✓ Admin Approved</div>
                            ) : v.adminAction === "REJECTED" ? (
                              <div className="font-semibold text-rose-600 font-medium">✕ Admin Rejected</div>
                            ) : v.adminAction === "NEEDS_CHANGES" ? (
                              <div className="font-semibold text-amber-600 font-medium">⟳ Admin Needs Changes</div>
                            ) : (
                              <div className="font-semibold text-amber-600 font-medium">Pending Admin Review</div>
                            )}

                            {v.clientAction === "APPROVED" && <div className="font-semibold text-emerald-600 font-medium mt-1">✓ Client Approved</div>}
                            {v.clientAction === "REJECTED" && <div className="font-semibold text-rose-600 font-medium mt-1">✕ Client Rejected</div>}
                            {v.clientAction === "CHANGES_REQUESTED" && <div className="font-semibold text-amber-600 font-medium mt-1">⟳ Client Changes Requested</div>}
                            
                            {v.clientFeedback && (
                              <p className="italic text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                                <span className="font-medium text-foreground">Client Feedback:</span> &ldquo;{v.clientFeedback}&rdquo;
                              </p>
                            )}
                            {v.adminNote && (
                              <p className="text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                                <span className="font-medium text-foreground">Admin Note:</span> &ldquo;{v.adminNote}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Actions */}
              {detailRender && (
                <div className="p-4 border-t border-border bg-card shrink-0 flex flex-col gap-2">
                  {["REVISION_REQUIRED", "REJECTED", "ADMIN_REJECTED"].includes(detailRender.currentStatus || detailRender.status) && (
                    <Button
                      className="w-full bg-status-revision-foreground text-status-revision hover:bg-status-revision-foreground/90 font-semibold"
                      onClick={() => {
                        setDetailRender(null);
                        openRevisionSheet(detailRender);
                      }}
                    >
                      Submit Revision
                    </Button>
                  )}
                  
                  {(detailRender.currentStatus || detailRender.status) !== "COMPLETE" && 
                   (detailRender.createdById === currentUser?.id || currentUser?.role === "ADMIN") && (
                    <Button
                      variant="destructive"
                      className="w-full rounded-xl"
                      onClick={() => handleDeleteRender(detailRender.id)}
                    >
                      Delete Render
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
