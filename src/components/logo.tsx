import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 group", className)}>
      {/* Shield emblem with trust gradient */}
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-[1px] shadow-sm shadow-blue-500/25">
        <span className="grid size-full place-items-center rounded-[11px] bg-slate-950/90 transition-colors group-hover:bg-slate-900/90">
          <ShieldAlert className="size-4.5 text-blue-400 transition-colors group-hover:text-cyan-300" />
        </span>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1.5">
          <span className="text-[16px] font-bold tracking-tight text-white font-sans">
            FakeShield
          </span>
          <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-[1px] text-[9.5px] font-bold font-mono tracking-wider text-blue-400">
            AI
          </span>
        </span>
        <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400">
          Cyber Threat Intelligence
        </span>
      </span>
    </span>
  );
}
