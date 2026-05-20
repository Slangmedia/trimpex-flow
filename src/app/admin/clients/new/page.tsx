"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Check, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NewClientPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    pin: "",
    logoUrl: "",
    projectName: "",
    projectDescription: "",
    projectRenderCount: "",
    projectDeadline: "",
    projectEmployees: [] as string[],
  });

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployeesList(data);
        }
      } catch (e) {
        console.error("Failed to load employees:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, logoUrl: data.url }));
      } else {
        alert("Failed to upload logo.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error occurred during logo upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleEmployee = (empName: string) => {
    setFormData((prev) => ({
      ...prev,
      projectEmployees: prev.projectEmployees.includes(empName)
        ? prev.projectEmployees.filter((name) => name !== empName)
        : [...prev.projectEmployees, empName],
    }));
  };

  const toggleAllEmployees = () => {
    if (formData.projectEmployees.length === employeesList.length) {
      setFormData((prev) => ({ ...prev, projectEmployees: [] }));
    } else {
      setFormData((prev) => ({ ...prev, projectEmployees: employeesList.map((e) => e.name) }));
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contactPerson || !formData.email) {
      alert("Please fill in all required client details (Company name, Contact person, Email).");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          logoUrl: formData.logoUrl,
          projectName: formData.projectName,
          projectDescription: formData.projectDescription,
          projectRenderCount: formData.projectRenderCount,
          projectDeadline: formData.projectDeadline,
          projectEmployees: formData.projectEmployees,
        }),
      });

      if (res.ok) {
        router.push("/admin/clients");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save client.");
      }
    } catch (e) {
      console.error("Error saving client:", e);
      alert("An error occurred while saving the client.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 w-full max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground">Set up a new client profile and initial project space.</p>
        </div>
      </div>

      <form onSubmit={handleSaveClient} className="space-y-8">
        {/* Client Profile Section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight border-b border-border/50 pb-3">Client Profile Information</h2>
          
          {/* Logo Upload Component */}
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative group cursor-pointer" onClick={handleLogoClick}>
              <Avatar className="h-20 w-20 border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all rounded-lg">
                <AvatarImage src={formData.logoUrl} className="object-cover rounded-lg" />
                <AvatarFallback className="bg-muted text-muted-foreground flex flex-col items-center justify-center text-[10px] rounded-lg">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
                      <span>Upload Logo</span>
                    </>
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                Change
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="font-semibold text-sm">Client Brand Logo</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Supports SVG, PNG, JPG or WEBP formats.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {formData.logoUrl && (
                <div className="flex items-center justify-center sm:justify-start text-emerald-600 text-xs gap-1 font-medium mt-1">
                  <Check className="h-3 w-3" /> Logo uploaded successfully
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Acme Corp" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person *</label>
              <Input name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="e.g. Jane Doe" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="jane@example.com" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +1 555 0199" />
            </div>
          </div>
        </div>

        {/* Initial Project Details Section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight border-b border-border/50 pb-3">Initial Project Space</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="e.g. Q2 Product Renders" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Project Description</label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                placeholder="Describe the initial project requirements..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Render Items</label>
              <Input name="projectRenderCount" type="number" value={formData.projectRenderCount} onChange={handleInputChange} placeholder="e.g. 10" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline Date</label>
              <Input name="projectDeadline" type="date" value={formData.projectDeadline} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Assign Creative Team</label>
              {employeesList.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllEmployees}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {formData.projectEmployees.length === employeesList.length ? "Deselect All" : "Select All Employees"}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-border/80 bg-muted/20 rounded-lg max-h-56 overflow-y-auto">
              {employeesList.length === 0 ? (
                <div className="col-span-full text-center text-sm text-muted-foreground py-4 italic">No creative team members found.</div>
              ) : (
                employeesList.map((emp) => {
                  const isAssigned = formData.projectEmployees.includes(emp.name);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.name)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        isAssigned 
                          ? "bg-primary/5 border-primary text-primary font-medium shadow-xs" 
                          : "bg-background border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-sm truncate mr-2">{emp.name}</span>
                      {isAssigned && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href="/admin/clients">
            <Button variant="outline" type="button" className="px-5">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="px-6">
            {isSaving ? "Creating Client..." : "Create Client Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
