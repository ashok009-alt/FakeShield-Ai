import { RISK_META, SEVERITY_META } from "@/lib/constants";
import type { RiskLevel, Severity } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export function RiskBadge({
  level,
  className,
  showDot = true,
}: {
  level: RiskLevel;
  className?: string;
  showDot?: boolean;
}) {
  const meta = RISK_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide uppercase",
        meta.text,
        meta.bg,
        meta.border,
        className
      )}
    >
      {showDot ? <span className={cn("size-1.5 rounded-full animate-pulse", meta.dot)} /> : null}
      {meta.label}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        meta.text,
        meta.bg,
        meta.border,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
