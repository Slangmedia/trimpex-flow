"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, Shield, Upload, Loader2, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatarUrl: "",
  });

  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    employees: 0,
    renders: 0,
  });

  const [portalName, setPortalName] = useState("3DFlow");
  const [supportEmail, setSupportEmail] = useState("support@3dflow.com");
  const [accentColor, setAccentColor] = useState("indigo");
  const [logoUrl, setLogoUrl] = useState("");
  const [copyrightText, setCopyrightText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showBrandSavedToast, setShowBrandSavedToast] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.admin.name,
            email: data.admin.email,
            password: "",
            avatarUrl: data.admin.avatarUrl || "",
          });
          setStats(data.stats);
          
          if (data.branding) {
            setPortalName(data.branding.companyName);
            setSupportEmail(data.branding.supportEmail);
            setAccentColor(data.branding.accentColor);
            setLogoUrl(data.branding.logoUrl || "");
            setCopyrightText(data.branding.copyrightText || "");
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
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
        setFormData((prev) => ({ ...prev, avatarUrl: data.url }));
      } else {
        alert("Failed to upload profile image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsUploadingLogo(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.url);
      } else {
        alert("Failed to upload logo image.");
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      alert("Error occurred during logo upload.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill in required fields (Name and Email).");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          avatarUrl: formData.avatarUrl,
        }),
      });

      if (res.ok) {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      alert("An error occurred while saving configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName || !supportEmail) {
      alert("Company Brand Name and Support Email are required.");
      return;
    }

    setIsSavingBrand(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branding: {
            companyName: portalName,
            supportEmail: supportEmail,
            accentColor,
            logoUrl: logoUrl || null,
            copyrightText: copyrightText || `© ${new Date().getFullYear()} ${portalName}. All rights reserved.`,
          }
        }),
      });

      if (res.ok) {
        setShowBrandSavedToast(true);
        setTimeout(() => setShowBrandSavedToast(false), 3000);
        // Dispatch custom event to notify layout of branding changes
        window.dispatchEvent(new Event("branding-updated"));
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update brand settings.");
      }
    } catch (err) {
      console.error("Save brand settings error:", err);
      alert("An error occurred while saving brand configuration.");
    } finally {
      setIsSavingBrand(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground font-mono">
        Loading system configuration settings...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage administrator profile, application brand, and view platform metrics.</p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clients", value: stats.clients },
          { label: "Active Projects", value: stats.projects },
          { label: "Employees", value: stats.employees },
          { label: "Render Items", value: stats.renders },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            <span className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Admin Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">Administrator Account</h2>
              </div>

              {/* Profile Image Upload Component */}
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <Avatar className="h-20 w-20 border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={formData.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground flex flex-col items-center justify-center text-[10px]">
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
                          <span>Upload</span>
                        </>
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    Change
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="font-semibold text-sm">Profile Image</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Upload an avatar image to display in your navigation header.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {formData.avatarUrl && (
                    <div className="flex items-center justify-center sm:justify-start text-emerald-600 text-xs gap-1 font-medium mt-1">
                      <Check className="h-3 w-3" /> Image uploaded successfully
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Change Password</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current password" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              {showSavedToast ? (
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Check className="h-4 w-4" /> Account updated successfully
                </span>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={isSaving || isUploading} className="px-6">
                {isSaving ? "Saving..." : "Save Account Settings"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column - Brand Config Form */}
        <div className="space-y-6">
          <form onSubmit={handleSaveBrandSettings} className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-3">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Portal Brand Styling</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Brand Name</label>
                <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Support Contact Email</label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required />
              </div>

              {/* Logo Upload field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Logo</label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative h-12 w-20 border border-border rounded bg-muted flex items-center justify-center p-1 group overflow-hidden">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="absolute inset-0 bg-destructive/80 text-destructive-foreground text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="h-12 w-20 border border-dashed border-border rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors text-[9px] text-muted-foreground"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mb-0.5 text-muted-foreground" />
                          <span>Upload</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <div className="flex-1 text-[10px] text-muted-foreground leading-normal">
                    Custom logo image to replace the default brand header.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Copyright Footer Text</label>
                <Input value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} placeholder="e.g. © 2026 3DFlow. All rights reserved." />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accent Theme color</label>
                <div className="flex items-center gap-2 pt-2">
                  {[
                    { name: "indigo", class: "bg-indigo-600" },
                    { name: "emerald", class: "bg-emerald-600" },
                    { name: "sky", class: "bg-sky-600" },
                    { name: "amber", class: "bg-amber-600" },
                    { name: "rose", class: "bg-rose-600" },
                  ].map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setAccentColor(color.name)}
                      className={`h-7 w-7 rounded-full border border-border/60 ${color.class} cursor-pointer transition-transform hover:scale-110 ${accentColor === color.name ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {showBrandSavedToast && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Check className="h-3 w-3" /> Brand settings updated successfully
                </span>
              )}
              <Button type="submit" disabled={isSavingBrand || isUploadingLogo} className="w-full">
                {isSavingBrand ? "Saving Brand..." : "Save Brand Styling"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

