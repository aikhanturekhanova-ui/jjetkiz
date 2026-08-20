import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" | "muted"> = {
  created: "secondary",
  matching: "info",
  offered: "purple",
  accepted: "success",
  in_progress: "warning",
  delivered: "success",
  cancelled: "destructive",
  expired: "muted",
  online: "success",
  offline: "muted",
  on_order: "warning",
  sent: "info",
  declined: "destructive",
  active: "success",
  good: "success",
  acceptable: "warning",
  poor: "destructive",
  critical: "destructive",
  high: "warning",
  normal: "muted",
  customer: "info",
  driver: "success",
  admin: "purple",
  complete: "success",
  incomplete: "muted",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"} className={cn(className)}>
      {status}
    </Badge>
  );
}