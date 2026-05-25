"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, Bell, UserCircle } from "lucide-react";

const navigation = [
  { name: "My Projects", href: "/employee/projects", icon: Briefcase },
  { name: "Notifications", href: "/employee/notifications", icon: Bell },
  { name: "Profile", href: "/employee/profile", icon: UserCircle },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
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
        console.error("Failed to load branding in employee sidebar", e);
      }
    }
    loadBranding();
  }, []);

  return (
    <div className="flex h-full w-60 flex-col bg-background border-r border-border">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border gap-2.5">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-7 w-auto object-contain max-w-[140px]" />
        ) : (
          <h1 className="text-[18px] font-semibold text-foreground tracking-tight">{branding.companyName}</h1>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 px-4 pb-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  "group flex items-center px-3 py-2 text-sm rounded-md transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground",
                    "mr-3 h-5 w-5 flex-shrink-0"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

