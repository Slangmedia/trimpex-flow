"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Eye, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClientRowActions({
  clientId,
  publicLinkToken,
}: {
  clientId: string;
  publicLinkToken: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const link = `${window.location.origin}/c/${publicLinkToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    // Use a custom confirm pattern - no native browser dialogs
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity relative"
        onClick={copyLink}
        title="Copy Public Link"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Link href={`/admin/clients/${clientId}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        title="Delete Client"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
