"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatarUrl: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch(`/api/employees/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name,
            email: data.email,
            password: "", // Keep password blank unless changing it
            avatarUrl: data.avatarUrl || "",
          });
        } else {
          alert("Failed to fetch employee details.");
        }
      } catch (err) {
        console.error("Load employee error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployee();
  }, [params.id]);

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
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
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

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields (Full name, Email).");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined, // Send password only if filled
          avatarUrl: formData.avatarUrl,
        }),
      });

      if (res.ok) {
        router.push("/admin/employees");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update employee details.");
      }
    } catch (err) {
      console.error("Update employee error:", err);
      alert("An error occurred while updating the employee.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground font-mono">
        Loading employee profile data...
      </div>
    );
  }

  return (
    <div className="p-5 w-full max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/admin/employees"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Employees
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Employee Profile</h1>
          <p className="text-muted-foreground">Modify credentials, password, and profile image.</p>
        </div>
      </div>

      <form onSubmit={handleUpdateEmployee} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight border-b border-border/50 pb-3">Account Details</h2>
          
          {/* Profile Image Upload Component */}
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-24 w-24 border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
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
              <h3 className="font-semibold text-sm">Profile Photo</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Supports JPG, PNG or WEBP formats. Recommended size: 256x256 pixels.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadSuccess && (
                <div className="flex items-center justify-center sm:justify-start text-emerald-600 text-xs gap-1 font-medium mt-1">
                  <Check className="h-3 w-3" /> Image uploaded successfully
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Priya Patel"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="priya@3dflow.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href="/admin/employees">
            <Button variant="outline" type="button" className="px-5">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSaving || isUploading} className="px-6">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
