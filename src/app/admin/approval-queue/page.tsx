"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, Search, CheckSquare, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRenders, setSelectedRenders] = useState<Set<string>>(new Set());
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [renderToReject, setRenderToReject] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/approval-queue");
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (e) {
      console.error("Failed to load approval queue", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedRenders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRenders(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedRenders.size === filteredQueue.length) {
      setSelectedRenders(new Set());
    } else {
      setSelectedRenders(new Set(filteredQueue.map(r => r.id)));
    }
  };

  const handleRejectClick = (id: string) => {
    setRenderToReject(id);
    setIsRejectModalOpen(true);
  };

  const handleApprove = async (id: string) => {
    if (confirm("Are you sure you want to approve this render and send it to the client?")) {
      try {
        const res = await fetch(`/api/admin/approval-queue/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE" })
        });
        if (res.ok) {
          setQueue(queue.filter(q => q.id !== id));
          setSelectedRenders(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } else {
          alert("Failed to approve render version.");
        }
      } catch (e) {
        console.error("Error approving render", e);
      }
    }
  };

  const handleConfirmReject = async () => {
    if (!renderToReject) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/approval-queue/${renderToReject}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", note: rejectNote })
      });
      if (res.ok) {
        setQueue(queue.filter(q => q.id !== renderToReject));
        setSelectedRenders(prev => {
          const next = new Set(prev);
          next.delete(renderToReject);
          return next;
        });
        setIsRejectModalOpen(false);
        setRejectNote("");
        setRenderToReject(null);
      } else {
        alert("Failed to reject render version.");
      }
    } catch (e) {
      console.error("Error rejecting render", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSelected = async () => {
    if (confirm(`Are you sure you want to approve all ${selectedRenders.size} selected renders?`)) {
      setIsSubmitting(true);
      try {
        const approvePromises = Array.from(selectedRenders).map(id =>
          fetch(`/api/admin/approval-queue/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "APPROVE" })
          })
        );
        await Promise.all(approvePromises);
        setQueue(queue.filter(q => !selectedRenders.has(q.id)));
        setSelectedRenders(new Set());
      } catch (e) {
        console.error("Error approving multiple renders", e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredQueue = queue.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.clientName.toLowerCase().includes(query) ||
      item.projectName.toLowerCase().includes(query) ||
      item.renderName.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.employee.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-muted-foreground mt-1">Review and approve renders submitted by employees.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search queue..." 
              className="pl-8 w-64" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {selectedRenders.size > 0 && (
            <Button onClick={handleApproveSelected} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckSquare className="mr-2 h-4 w-4" /> Approve Selected ({selectedRenders.size})
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">Loading approval queue from live database...</div>
        ) : (
          <>
            {filteredQueue.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground px-1">
                <input 
                  type="checkbox" 
                  id="selectAll"
                  className="rounded border-border cursor-pointer w-4 h-4"
                  checked={selectedRenders.size === filteredQueue.length && filteredQueue.length > 0}
                  onChange={toggleSelectAll}
                />
                <label htmlFor="selectAll" className="cursor-pointer select-none">Select All {filteredQueue.length} items in queue</label>
              </div>
            )}
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredQueue.length === 0 ? (
                <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed rounded-2xl bg-card">
                  The approval queue is empty.
                </div>
              ) : (
                filteredQueue.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:border-foreground/20 transition-colors flex flex-col rounded-3xl border-slate-200 shadow-sm group p-0 gap-0">
                    <div className="aspect-video bg-slate-100 relative overflow-hidden group/image cursor-pointer" onClick={() => { if (item.fileUrl) setLightboxImage(item.fileUrl); }}>
                      {item.fileUrl ? (
                        <img src={item.fileUrl} className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-700" alt={item.renderName} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">NO PREVIEW</div>
                      )}
                      
                      <div className="absolute top-4 left-4 z-20" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white rounded-md shadow-sm p-1.5 flex items-center justify-center border border-slate-200">
                          <input 
                            type="checkbox" 
                            className="rounded-sm border-slate-300 cursor-pointer w-4 h-4 text-primary focus:ring-primary"
                            checked={selectedRenders.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </div>
                      </div>
                      
                      {/* Fullscreen Button */}
                      <div className="absolute inset-0 z-20 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/60 text-white p-3 rounded-full backdrop-blur-md shadow-lg transform translate-y-4 group-hover/image:translate-y-0 transition-all duration-300">
                          <Maximize2 className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="font-mono bg-black/80 text-white hover:bg-black border-none shadow-md backdrop-blur-md rounded-lg px-2.5 py-1 text-sm font-bold">
                          V{item.version}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col relative z-20 bg-white">
                      <div className="mb-4">
                        <h3 className="font-medium text-xl text-slate-900 mb-2 truncate" title={item.renderName}>{item.renderName}</h3>
                        <div className="flex justify-end items-center text-slate-500">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{item.submittedTime}</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto bg-slate-50/80 p-4 rounded-2xl">
                        <div className="grid grid-cols-[60px_1fr] gap-y-2.5 text-[12px]">
                          <div className="font-bold text-slate-700">Client:</div>
                          <div className="text-slate-500 truncate">{item.clientName}</div>
                          
                          <div className="font-bold text-slate-700">Project:</div>
                          <div className="text-slate-500 truncate">{item.projectName}</div>
                          
                          <div className="font-bold text-slate-700">Artist:</div>
                          <div className="text-slate-500 truncate">{item.employee}</div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 bg-slate-50/30 border-t border-slate-100 flex gap-4">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="w-16 h-12 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 flex-shrink-0 bg-white" 
                        onClick={() => handleRejectClick(item.id)}
                        disabled={isSubmitting}
                        title="Reject"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      <Button 
                        className="flex-1 h-12 bg-[#0d9468] hover:bg-[#0b7a55] text-white text-base font-medium rounded-2xl shadow-sm hover:shadow"
                        onClick={() => handleApprove(item.id)}
                        disabled={isSubmitting}
                      >
                        <Check className="mr-2 h-5 w-5" /> Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Render</DialogTitle>
            <DialogDescription>
              Provide an note for the employee explaining what needs adjustment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g. Lighting is too dark, please adjust exposure."
              className="min-h-[100px] resize-none"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              variant="outline" 
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleConfirmReject}
              disabled={isSubmitting || !rejectNote.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center backdrop-blur-sm"
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
            <img src={lightboxImage} style={{ transform: `scale(${zoomScale})` }}
              className="w-full h-full object-contain transition-transform duration-200 ease-out cursor-default" alt="Full size preview" />
          </div>
        </div>
      )}
    </div>
  );
}
