import { Clock, Loader2, ShieldQuestion, CheckCircle2, XCircle, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const COLORS: Record<string, string> = {
  pending: "bg-neutral-700 text-neutral-200",
  queued: "bg-neutral-700 text-neutral-200",
  running: "bg-blue-600/20 text-blue-400 border border-blue-600/40",
  waiting_permission: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40",
  done: "bg-green-600/20 text-green-400 border border-green-600/40",
  error: "bg-red-600/20 text-red-400 border border-red-600/40",
  canceled: "bg-neutral-700 text-neutral-400",
};

const ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  queued: Clock,
  running: Loader2,
  waiting_permission: ShieldQuestion,
  done: CheckCircle2,
  error: XCircle,
  canceled: Ban,
};

export function StatusBadge({ status }: { status: string }) {
  const Icon = ICONS[status] ?? Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        COLORS[status] ?? COLORS.pending
      }`}
    >
      <Icon className={`size-3 ${status === "running" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}
