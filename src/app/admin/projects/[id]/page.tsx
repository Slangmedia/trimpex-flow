"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  Search,
  FileDown,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  UploadCloud,
  LayoutGrid,
  List,
  Pencil,
  Loader2
} from "lucide-react";
import { useHeaderStore } from "@/lib/store/headerStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill, RenderStatus } from "@/components/StatusPill";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [renders, setRenders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRender, setSelectedRender] = useState<any | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTableMaximized, setIsTableMaximized] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [newRenderName, setNewRenderName] = useState("");
  const [newRenderSku, setNewRenderSku] = useState("");
  const [newRenderType, setNewRenderType] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [skuSearchQuery, setSkuSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminReview = async (action: "APPROVE" | "REJECT" | "NEEDS_CHANGES" | "UNDO", customNote?: string) => {
    if (!selectedRender) return;

    // Validate that feedback note is provided for needs changes actions (optional for reject)
    if (action === "NEEDS_CHANGES" && !customNote && !adminFeedback.trim()) {
      alert("Please write a feedback message explaining why this item needs changes.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/renders/${selectedRender.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          note: action === "UNDO" ? "" : (customNote || adminFeedback),
          versionId: selectedRender.currentVersionId,
        }),
      });

      if (res.ok) {
        // Refresh project data locally
        const loadRes = await fetch(`/api/projects/${params.id}`);
        if (loadRes.ok) {
          const data = await loadRes.json();
          setProject(data);
          setRenders(data.renderItems || []);
          
          // Update selectedRender state as well to reflect status change immediately in drawer
          const updatedItem = data.renderItems.find((r: any) => r.id === selectedRender.id);
          if (updatedItem) {
            setSelectedRender(updatedItem);
          } else {
            setIsDrawerOpen(false);
          }
        }
        setAdminFeedback("");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit review.");
      }
    } catch (e) {
      console.error("Failed to submit review", e);
      alert("Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          setTitle(data.name); // Dynamic Header Update!
          setRenders(data.renderItems || []);
        }
      } catch (e) {
        console.error("Failed to load project", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    
    return () => {
      setTitle(null); // Clear title on unmount
    };
  }, [params.id]);

  const openRenderDetail = (render: any) => {
    setSelectedRender(render);
    setSelectedVersion(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRender(null);
    setSelectedVersion(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      
      const lastDotIndex = file.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const cleanName = baseName.replace(/[_-]/g, ' ');
      setNewRenderName(cleanName);
    }
  };

  const handleAddRender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRenderName.trim()) return;

    let fileUrl = "";
    let fileType = "IMAGE";
    setIsUploading(true);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          fileUrl = url;
          fileType = selectedFile.type.startsWith("video/") ? "VIDEO" : "IMAGE";
        } else {
          console.error("File upload failed, falling back to preset.");
        }
      }

      if (!fileUrl) {
        const presets = [
          "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80"
        ];
        fileUrl = presets[Math.floor(Math.random() * presets.length)];
      }

      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRenderName,
          projectId: params.id,
          fileUrl,
          fileType,
          renderType: newRenderType
        })
      });
      if (res.ok) {
        const createdRender = await res.json();
        setRenders([createdRender, ...renders]);
        setNewRenderName("");
        setNewRenderType("");
        setSelectedFile(null);
        setFilePreview("");
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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background pb-20">
        <div className="bg-slate-900 text-white p-8 lg:px-12 animate-pulse">
          <div className="h-4 w-24 bg-slate-700 rounded mb-4" />
          <div className="h-8 w-64 bg-slate-700 rounded mb-3" />
          <div className="h-4 w-40 bg-slate-700 rounded" />
        </div>
        <div className="p-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Project not found.
        <br />
        <Link href="/admin/projects" className="text-primary underline mt-2 block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const uniqueEmployees = Array.from(
    new Map(
      renders
        .filter((r: any) => r.createdById && r.submittedBy)
        .map((r: any) => [r.createdById, r.submittedBy])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredRendersByEmployee = selectedEmployeeId === "all"
    ? renders
    : renders.filter((r: any) => r.createdById === selectedEmployeeId);

  const totalRenders = project.totalRenders || renders.length;
  const completeCount = filteredRendersByEmployee.filter((r: any) => r.currentStatus === "COMPLETE").length;
  const reviewCount = filteredRendersByEmployee.filter((r: any) => ["SUBMITTED", "CLIENT_PENDING", "ADMIN_REJECTED"].includes(r.currentStatus)).length;
  const revisionCount = filteredRendersByEmployee.filter((r: any) => ["REVISION_REQUIRED", "REJECTED"].includes(r.currentStatus)).length;

  // Custom tab counts
  const tabReviewCount = filteredRendersByEmployee.filter((r: any) => r.currentStatus === "SUBMITTED").length;
  const tabRevisionCount = filteredRendersByEmployee.filter((r: any) => r.currentStatus === "REVISION_REQUIRED").length;
  const tabRejectCount = filteredRendersByEmployee.filter((r: any) => ["REJECTED", "ADMIN_REJECTED"].includes(r.currentStatus)).length;
  const tabPendingClientCount = filteredRendersByEmployee.filter((r: any) => r.currentStatus === "CLIENT_PENDING").length;

  const renderTable = (filteredRenders: any[]) => (
    <div className="w-full overflow-x-auto">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-muted/10">
          <TableRow className="hover:bg-transparent border-b h-12">
            <TableHead className="px-8 lg:px-12 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Asset</TableHead>
            <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Ver</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Author</TableHead>
            <TableHead className="text-right px-8 lg:px-12 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRenders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                No render items found in this tab.
              </TableCell>
            </TableRow>
          ) : filteredRenders.map((render: any) => (
            <TableRow key={render.id} className="group cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-0 h-16">
              <TableCell className="px-8 lg:px-12 py-3" onClick={() => openRenderDetail(render)}>
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-lg bg-black overflow-hidden border shadow-sm group/thumb">
                    {render.imageUrl ? (
                      <img src={render.imageUrl} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[8px] font-bold">IMG</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); if (render.imageUrl) setLightboxImage(render.imageUrl); }}>
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 max-w-[200px]">
                    <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors truncate">{render.name}</span>
                    {render.clientFeedback ? (
                      <span className="text-[10px] text-amber-600 font-bold truncate" title={render.clientFeedback}>
                        Revision: {render.clientFeedback}
                      </span>
                    ) : render.adminNote ? (
                      <span className="text-[10px] text-rose-500 font-bold truncate" title={render.adminNote}>
                        Note: {render.adminNote}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">3D Asset</span>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center" onClick={() => openRenderDetail(render)}>
                <span className="text-[10px] font-black opacity-40">V{render.currentVersion}</span>
              </TableCell>
              <TableCell onClick={() => openRenderDetail(render)}>
                <StatusPill 
                  status={render.currentStatus as RenderStatus} 
                  adminAction={render.adminAction}
                  clientAction={render.clientAction}
                />
              </TableCell>
              <TableCell onClick={() => openRenderDetail(render)}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black border border-primary/20">
                    {render.submittedBy?.charAt(0) || "?"}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{render.submittedBy || "Unknown"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right px-8 lg:px-12 py-3">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { if (render.imageUrl) setLightboxImage(render.imageUrl); }}>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openRenderDetail(render)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const getFilteredRenders = (baseRenders: any[]) => {
    let filtered = baseRenders;
    if (selectedEmployeeId !== "all") {
      filtered = filtered.filter(r => r.createdById === selectedEmployeeId);
    }
    if (!skuSearchQuery.trim()) return filtered;
    const query = skuSearchQuery.toLowerCase();
    return filtered.filter(r => 
      r.name.toLowerCase().includes(query)
    );
  };

  const renderGridView = (filteredRenders: any[]) => (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 p-8 lg:p-12 bg-white">
      {filteredRenders.length === 0 ? (
        <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground text-sm">
          No render items found.
        </div>
      ) : (
        filteredRenders.map((render: any) => {
          const version = render.currentVersion !== undefined ? render.currentVersion : (render.version || 1);
          const sku = render.skuCode || render.sku || "SKU-GEN";
          const status = render.currentStatus || render.status || "SUBMITTED";
          const imageUrl = render.imageUrl || render.file_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

          return (
            <Card 
              key={render.id} 
              className="overflow-hidden hover:border-foreground/20 transition-colors flex flex-col rounded-2xl border-muted-foreground/20 shadow-sm cursor-pointer p-0 gap-0 h-full"
              onClick={() => openRenderDetail(render)}
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
                    status={status as RenderStatus} 
                    adminAction={render.adminAction}
                    clientAction={render.clientAction}
                    className="w-full justify-start py-2.5 px-4 text-[13px] rounded-lg" 
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderContent = (filteredRenders: any[]) => {
    const searched = getFilteredRenders(filteredRenders);
    return viewMode === "grid" ? renderGridView(searched) : renderTable(searched);
  };

  return (
    <div className="w-full min-h-screen bg-background pb-20">
      {/* HERO */}
      <div className="bg-slate-900 text-white p-8 lg:px-12 shadow-lg border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Layers className="w-48 h-48 rotate-12" />
        </div>
        <div className="relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Link href="/admin/projects" className="hover:text-white transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-primary">Details</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
                <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-0.5 text-[10px] uppercase tracking-widest font-bold">
                  {project.clientName}
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: <strong className="text-white">{project.deadline}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers className="w-4 h-4" />
                  <span><strong className="text-white">{completeCount}/{totalRenders}</strong> Done</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <Link href={`/admin/projects/${project.id}/edit`}>
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl h-10 px-5 flex items-center gap-2 transition-colors">
                  <Pencil className="h-4 w-4" /> Edit Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="bg-muted/30 border-b w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x border-x-0">
          {[
            { label: "Approved", value: completeCount, color: "emerald", icon: CheckCircle2 },
            { label: "In Review", value: reviewCount, color: "blue", icon: Clock },
            { label: "Revisions", value: revisionCount, color: "amber", icon: AlertCircle },
          ].map((stat, i) => (
            <div key={i} className="group bg-transparent hover:bg-white transition-all duration-300">
              <div className="p-6 lg:px-12 flex items-center gap-5">
                <div className={cn(
                  "p-3.5 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                  stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-600" :
                  stat.color === "blue" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-black tracking-tight">{stat.value} <span className="text-sm font-bold opacity-40">Renders</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <Tabs defaultValue="all" className={cn("w-full transition-all duration-300", isTableMaximized ? "fixed inset-0 z-[100] bg-background p-0 overflow-auto" : "")}>
        <div className={cn("bg-card border-b shadow-sm overflow-hidden w-full transition-all border-x-0", isTableMaximized && "h-full")}>
          <div className="px-8 lg:px-12 py-5 flex flex-col md:flex-row justify-between items-center gap-4 border-b bg-muted/20">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={() => setIsTableMaximized(!isTableMaximized)}>
                {isTableMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Filter Name..." 
                  className="pl-9 h-9 bg-background border-border rounded-lg text-xs" 
                  value={skuSearchQuery}
                  onChange={(e) => setSkuSearchQuery(e.target.value)}
                />
              </div>
              {uniqueEmployees.length > 1 && (
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Employees</option>
                  {uniqueEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto shrink-0 justify-end">
              <TabsList className="bg-muted/50 border border-border rounded-xl p-1 h-auto gap-1">
                <TabsTrigger
                  value="all"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-foreground hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  All
                  <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                    {renders.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="pending-review"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-blue-600 hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  Review
                  {tabReviewCount > 0 && (
                    <Badge className="ml-2 bg-blue-100 text-blue-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                      {tabReviewCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="revision"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-amber-600 hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  Revision
                  {tabRevisionCount > 0 && (
                    <Badge className="ml-2 bg-amber-100 text-amber-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                      {tabRevisionCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="reject"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-rose-600 hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  Reject
                  {tabRejectCount > 0 && (
                    <Badge className="ml-2 bg-rose-100 text-rose-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                      {tabRejectCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="client-pending"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-indigo-600 hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  Pending
                  {tabPendingClientCount > 0 && (
                    <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                      {tabPendingClientCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="complete"
                  className="group rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all
                    hover:bg-background hover:text-emerald-600 hover:shadow-sm
                    data-[active]:bg-black data-[active]:text-white data-[active]:shadow-sm data-[active]:font-semibold"
                >
                  Done
                  {completeCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-transparent px-1.5 py-0 min-w-5 group-data-[active]:bg-white/20 group-data-[active]:text-white">
                      {completeCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="flex border rounded-lg overflow-hidden bg-background h-9">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-full w-9 rounded-none border-0", viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-full w-9 rounded-none border-l border-y-0 border-r-0", viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <TabsContent value="all" className="mt-0 outline-none">
            {renderContent(renders)}
          </TabsContent>
          <TabsContent value="pending-review" className="mt-0 outline-none">
            {renderContent(renders.filter((r: any) => r.currentStatus === "SUBMITTED"))}
          </TabsContent>
          <TabsContent value="revision" className="mt-0 outline-none">
            {renderContent(renders.filter((r: any) => r.currentStatus === "REVISION_REQUIRED"))}
          </TabsContent>
          <TabsContent value="reject" className="mt-0 outline-none">
            {renderContent(renders.filter((r: any) => ["REJECTED", "ADMIN_REJECTED"].includes(r.currentStatus)))}
          </TabsContent>
          <TabsContent value="client-pending" className="mt-0 outline-none">
            {renderContent(renders.filter((r: any) => r.currentStatus === "CLIENT_PENDING"))}
          </TabsContent>
          <TabsContent value="complete" className="mt-0 outline-none">
            {renderContent(renders.filter((r: any) => r.currentStatus === "COMPLETE"))}
          </TabsContent>
        </div>
      </Tabs>

      {/* DETAIL DRAWER */}
      {/* DETAIL DIALOG */}
      <Dialog open={isDrawerOpen} onOpenChange={(open) => !open && handleCloseDrawer()}>
        <DialogContent className="max-w-[100vw] h-[100dvh] sm:h-[80vh] sm:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col sm:rounded-xl w-full sm:w-[95vw]">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-background pr-10">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono bg-accent text-accent-foreground rounded-[4px]">
                V{selectedVersion ? selectedVersion.versionNumber : (selectedRender?.currentVersion || selectedRender?.version || 1)}
              </Badge>
              <h2 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{selectedRender?.name}</h2>
              {selectedRender && (
                <StatusPill 
                  status={selectedRender.currentStatus || selectedRender.status || "SUBMITTED"} 
                  adminAction={selectedRender.adminAction}
                  clientAction={selectedRender.clientAction}
                  className="hidden sm:inline-flex" 
                />
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row bg-muted/30 h-full">
            {/* Preview Area */}
            <div className="flex-1 min-h-[40vh] sm:min-h-0 bg-black flex items-center justify-center relative group h-full">
              {(selectedVersion?.fileUrl || selectedRender?.imageUrl) ? (
                <>
                  {(() => {
                    const fileUrl = selectedVersion?.fileUrl || selectedRender?.imageUrl;
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
                        className="max-w-full max-h-full"
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
                      const fileUrl = selectedVersion?.fileUrl || selectedRender?.imageUrl;
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
            <div className="w-full sm:w-[380px] bg-background border-t sm:border-t-0 sm:border-l border-border shrink-0 flex flex-col h-full overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 h-full space-y-6">
                {/* Admin Review Action Area */}
                {selectedRender?.currentStatus === "SUBMITTED" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
                    <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight">
                      <Check className="w-4 h-4 text-primary" /> Admin Review
                    </h3>
                    <textarea
                      placeholder="Add feedback / internal note (optional)..."
                      value={adminFeedback}
                      onChange={(e) => setAdminFeedback(e.target.value)}
                      disabled={isSubmittingReview}
                      className="w-full min-h-[80px] bg-background border rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <Button 
                        className="w-full h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
                        onClick={() => handleAdminReview("APPROVE")}
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview ? "Processing..." : "Approve"}
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 h-9 text-xs font-semibold bg-amber-500 hover:bg-amber-600 rounded-lg text-white"
                          onClick={() => handleAdminReview("NEEDS_CHANGES")}
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? "Processing..." : "Needs Changes"}
                        </Button>
                        <Button 
                          className="flex-1 h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 rounded-lg text-white"
                          onClick={() => handleAdminReview("REJECT")}
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? "Processing..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Undo Action Area */}
                {(selectedRender?.currentStatus === "ADMIN_REJECTED" || selectedRender?.currentStatus === "REVISION_REQUIRED") && (
                  <div className="space-y-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight text-amber-600">
                        <RotateCcw className="w-4 h-4" /> Review Decision Made
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      This item is marked as{" "}
                      <span className="font-bold text-foreground animate-pulse">
                        {selectedRender.currentStatus === "ADMIN_REJECTED" ? "Rejected" : "Needs Changes"}
                      </span>
                      . You can undo this decision to reset the item back to submitted and review it again.
                    </p>
                    <Button 
                      className="w-full h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center justify-center gap-2"
                      onClick={() => handleAdminReview("UNDO")}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? "Processing..." : "Undo Review Decision"}
                    </Button>
                  </div>
                )}

                {selectedRender && selectedRender.adminNote !== "[REUPLOAD_REQUEST]" && (
                  <div className="space-y-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight text-rose-600">
                        <AlertCircle className="w-4 h-4" /> Reupload Request
                      </h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      If the image fails to load or the file is missing/broken, you can ask the employee to reupload it. The version number will remain unchanged.
                    </p>
                    <Button 
                      className="w-full h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center gap-2"
                      onClick={() => {
                        if (confirm("Are you sure you want to request a file reupload for this render? This will ask the employee to upload a replacement file without incrementing the version count.")) {
                          handleAdminReview("NEEDS_CHANGES", "[REUPLOAD_REQUEST]");
                        }
                      }}
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? "Processing..." : "Request Reupload"}
                    </Button>
                  </div>
                )}

                <div>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Revision History</h3>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-px before:bg-border">
                    {selectedRender?.versionsHistory?.map((v: any) => {
                      const isSelected = selectedVersion ? (selectedVersion.id === v.id) : (v.versionNumber === (selectedRender.currentVersion || selectedRender.version || 1));
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
                              {v.versionNumber === (selectedRender.currentVersion || selectedRender.version || 1) && (
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
                                  <span className="font-medium text-foreground">Client Feedback:</span> "{v.clientFeedback}"
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

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-10 backdrop-blur-sm"
          onClick={() => { setLightboxImage(null); setZoomScale(1); }}>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/10 z-10"
            onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl"
              onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}><ZoomOut className="h-5 w-5" /></Button>
            <div className="px-4 text-xs font-black text-white w-20 text-center">{Math.round(zoomScale * 100)}%</div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl"
              onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}><ZoomIn className="h-5 w-5" /></Button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl"
              onClick={() => setZoomScale(1)}><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <Button variant="ghost" size="icon" className="absolute top-10 right-10 text-white hover:bg-white/10 rounded-full h-12 w-12 z-10"
            onClick={() => { setLightboxImage(null); setZoomScale(1); }}><X className="h-6 w-6" /></Button>
          <div className="w-full h-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const isVideo = lightboxImage && (
                lightboxImage.toLowerCase().endsWith(".mp4") ||
                lightboxImage.toLowerCase().endsWith(".webm") ||
                lightboxImage.toLowerCase().endsWith(".ogg") ||
                lightboxImage.toLowerCase().endsWith(".mov") ||
                project?.renderItems?.some((item: any) => 
                  item.imageUrl === lightboxImage || 
                  item.versions?.some((v: any) => v.file_url === lightboxImage && v.file_type === "VIDEO")
                )
              );
              return isVideo ? (
                <video src={lightboxImage} controls style={{ transform: `scale(${zoomScale})` }}
                  className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg transition-transform duration-200 ease-out" />
              ) : (
                <img src={lightboxImage} style={{ transform: `scale(${zoomScale})` }}
                  className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg transition-transform duration-200 ease-out cursor-default" alt="Full size preview" />
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD RENDER SHEET */}
      <Sheet open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Render</SheetTitle>
            <SheetDescription>Upload and add a new render to this project.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddRender} className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Render Name *</label>
              <Input 
                placeholder="e.g. Living Room Front View" 
                value={newRenderName} 
                onChange={(e) => setNewRenderName(e.target.value)} 
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
                ref={fileInputRef}
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div 
                className={`border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors relative ${
                  isUploading ? "bg-muted/30 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50"
                }`}
                onClick={() => {
                  if (!isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-black animate-spin mb-4" />
                    <p className="text-sm font-bold mb-1 text-black">Uploading Render...</p>
                    <p className="text-xs text-muted-foreground">Please wait while the asset is being uploaded securely</p>
                  </>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-emerald-600">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Click again to replace file</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click to upload render</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, MP4 up to 100MB</p>
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Render"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
