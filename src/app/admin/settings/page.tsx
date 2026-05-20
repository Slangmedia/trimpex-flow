"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, Shield, BarChart3, Upload, Loader2, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

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
        {/* Left Columns - Forms */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* Admin Profile Details */}
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
                  <Check className="h-4 w-4" /> Settings updated successfully
                </span>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={isSaving || isUploading} className="px-6">
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column - Brand Config info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-3">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Portal Brand Styling</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Brand Name</label>
                <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Support Contact Email</label>
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accent Theme color</label>
                <div className="flex items-center gap-2 pt-2">
                  {["bg-indigo-600", "bg-emerald-600", "bg-sky-600", "bg-amber-600", "bg-rose-600"].map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`h-7 w-7 rounded-full border border-border/60 ${color} cursor-pointer transition-transform hover:scale-110 ${i === 0 ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
