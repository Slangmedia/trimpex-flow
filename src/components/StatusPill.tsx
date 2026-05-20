import { cn } from "@/lib/utils";

export type RenderStatus = 
  | "SUBMITTED" 
  | "CLIENT_PENDING" 
  | "COMPLETE" 
  | "REJECTED" 
  | "REVISION_REQUIRED" 
  | "ADMIN_REJECTED"
  | "REVISION_PENDING";

interface StatusPillProps {
  status: RenderStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config: Record<RenderStatus, { label: string; classes: string }> = {
    SUBMITTED: { label: "Submitted", classes: "bg-status-submitted text-status-submitted-foreground" },
    CLIENT_PENDING: { label: "Pending", classes: "bg-status-pending text-status-pending-foreground" },
    COMPLETE: { label: "Complete", classes: "bg-status-complete text-status-complete-foreground" },
    REJECTED: { label: "Rejected", classes: "bg-status-rejected text-status-rejected-foreground" },
    REVISION_REQUIRED: { label: "Revision Required", classes: "bg-status-revision text-status-revision-foreground" },
    ADMIN_REJECTED: { label: "Internal Reject", classes: "bg-status-internal text-status-internal-foreground" },
    REVISION_PENDING: { label: "Revision Pending", classes: "bg-status-revision text-status-revision-foreground" },
  };

  const { label, classes } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1.5 rounded-[4px] text-[12px] font-mono leading-none",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
