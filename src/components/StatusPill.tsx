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
  adminAction?: string | null;
  clientAction?: string | null;
  className?: string;
}

export function StatusPill({ status, adminAction, clientAction, className }: StatusPillProps) {
  const config: Record<RenderStatus, { label: string; classes: string }> = {
    SUBMITTED: { label: "Submitted", classes: "bg-status-submitted text-status-submitted-foreground" },
    CLIENT_PENDING: { label: "Pending", classes: "bg-status-pending text-status-pending-foreground" },
    COMPLETE: { label: "Complete", classes: "bg-status-complete text-status-complete-foreground" },
    REJECTED: { label: "Rejected", classes: "bg-status-rejected text-status-rejected-foreground" },
    REVISION_REQUIRED: { label: "Revision Required by client", classes: "bg-status-revision text-status-revision-foreground" },
    ADMIN_REJECTED: { label: "Revision Required by admin", classes: "bg-status-internal text-status-internal-foreground" },
    REVISION_PENDING: { label: "Revision Pending", classes: "bg-status-revision text-status-revision-foreground" },
  };

  let { label, classes } = config[status];
  let isRevisionRequired = false;
  let revisionActor: "admin" | "client" | null = null;

  if (status === "REVISION_REQUIRED") {
    if (adminAction === "NEEDS_CHANGES") {
      isRevisionRequired = true;
      revisionActor = "admin";
      classes = config.ADMIN_REJECTED.classes;
    } else if (clientAction === "CHANGES_REQUESTED") {
      isRevisionRequired = true;
      revisionActor = "client";
      classes = config.REVISION_REQUIRED.classes;
    } else {
      isRevisionRequired = true;
      revisionActor = "client";
    }
  } else if (status === "ADMIN_REJECTED") {
    isRevisionRequired = true;
    revisionActor = "admin";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-[4px] text-[12px] font-mono leading-none gap-1.5",
        classes,
        className
      )}
    >
      {isRevisionRequired && revisionActor ? (
        <>
          <span>Revision Required by</span>
          <span className="px-1.5 py-0.5 rounded bg-black/10 font-bold text-[10.5px] uppercase tracking-wider">
            {revisionActor}
          </span>
        </>
      ) : (
        label
      )}
    </span>
  );
}
