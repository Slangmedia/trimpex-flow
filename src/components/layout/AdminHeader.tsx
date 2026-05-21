"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHeaderStore } from "@/lib/store/headerStore";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const customTitle = useHeaderStore((state) => state.title);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    avatarUrl: string;
    role: string;
  } | null>(null);

  // Improved breadcrumb logic
  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  let defaultTitle = "Dashboard";
  
  if (pathSegments.length > 0) {
    const last = pathSegments[pathSegments.length - 1];
    // If last segment is a number/ID or UUID, use a fallback
    if (!isNaN(Number(last)) || last.length > 20) {
      const parent = pathSegments[pathSegments.length - 2];
      defaultTitle = `${parent.charAt(0).toUpperCase() + parent.slice(1, -1)} Details`;
    } else {
      defaultTitle = last.charAt(0).toUpperCase() + last.slice(1).replace("-", " ");
    }
  }

  const title = customTitle || defaultTitle;

  // Determine role-based links
  const isAdmin = pathname?.startsWith("/admin");
  const notificationLink = isAdmin ? "/admin/notifications" : "/employee/notifications";
  const settingsLink = isAdmin ? "/admin/settings" : "/employee/profile";

  const lastPathnameRef = useRef(pathname);

  // Fetch current logged in user details
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Error fetching current user session:", err);
      }
    }

    const wasProfilePage = lastPathnameRef.current === "/admin/settings" || lastPathnameRef.current === "/employee/profile";
    const isProfilePage = pathname === "/admin/settings" || pathname === "/employee/profile";

    if (!currentUser || wasProfilePage || isProfilePage) {
      fetchMe();
    }

    lastPathnameRef.current = pathname;
  }, [pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.warn("NextAuth signOut bypassed or failed:", e);
    }
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center flex-1">
          <h2 className="text-[18px] font-semibold text-foreground">{title}</h2>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Bell with direct navigation */}
          <Link href={notificationLink}>
            <button 
              type="button" 
              className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded-xl transition-colors relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>
          </Link>
          
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
          
          {/* Profile Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-x-3 p-1.5 hover:bg-accent/40 rounded-xl transition-all outline-hidden cursor-pointer"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={currentUser?.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                  {currentUser ? getInitials(currentUser.name) : "..."}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:flex md:items-center">
                <span className="text-sm font-medium leading-6 text-foreground" aria-hidden="true">
                  {currentUser?.name || "Loading..."}
                </span>
              </span>
            </button>

            {/* Premium Dropdown Panel */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-xl border border-border bg-card p-2 shadow-lg ring-1 ring-black/5 animate-in slide-in-from-top-2 duration-100 z-50">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold truncate text-foreground mt-0.5">{currentUser?.name || "User Account"}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email || "loading..."}</p>
                </div>
                
                <Link
                  href={settingsLink}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
