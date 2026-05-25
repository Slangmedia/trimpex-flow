"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else {
        // Fetch current user details without caching to route based on role
        const meRes = await fetch("/api/user/me", { cache: "no-store" });
        if (meRes.ok) {
          const user = await meRes.json();
          if (user.role === "ADMIN") {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/employee/projects";
          }
        } else {
          setError("Failed to retrieve user role.");
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const [branding, setBranding] = useState({ companyName: "3DFlow", logoUrl: "" });

  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch("/api/branding");
        if (res.ok) {
          const data = await res.json();
          setBranding({
            companyName: data.companyName || "3DFlow",
            logoUrl: data.logoUrl || "",
          });
        }
      } catch (e) {
        console.error("Failed to load branding in login", e);
      }
    }
    loadBranding();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain max-w-[150px]" />
            ) : (
              <span>{branding.companyName}</span>
            )}
          </CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm text-center font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
