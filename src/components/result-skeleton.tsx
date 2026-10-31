import { Loader2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/progress";

export function ResultSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true" aria-label="Analyzing…">
      <div
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          border: "1px solid rgba(251,146,60,0.12)",
          background: "linear-gradient(145deg, rgba(28,20,12,0.97) 0%, rgba(15,9,6,0.99) 100%)",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Loader2 className="size-4 text-orange-400 animate-spin" />
            <span className="text-[13px] font-semibold text-white">Analyzing…</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.06] px-3 py-1">
            <span className="live-dot" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              Scanning patterns
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          {/* Score ring placeholder */}
          <div className="relative size-[148px] shrink-0">
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{ background: "rgba(251,146,60,0.06)", border: "8px solid rgba(251,146,60,0.08)" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Shield className="size-8 text-orange-500/30 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3.5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-2 w-48 mt-2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          border: "1px solid rgba(50,36,24,0.9)",
          background: "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)",
        }}
      >
        <Skeleton className="h-4 w-32 mb-5" />
        <div className="space-y-3">
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-11/12" />
          </div>
        </div>
      </div>

      <p className="px-1 text-[11px] text-stone-600 flex items-center gap-1.5">
        <Loader2 className="size-3 animate-spin" />
        Checking message patterns against known scam signatures…
      </p>
    </div>
  );
}
