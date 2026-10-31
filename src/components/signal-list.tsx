"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { SEVERITY_META } from "@/lib/constants";
import type { Signal } from "@/lib/analysis/types";
import { SeverityBadge } from "@/components/risk-badge";
import { cn } from "@/lib/utils";

// Severity-based left border colours
const SEVERITY_BORDER: Record<string, string> = {
  low: "border-amber-500/40",
  medium: "border-amber-500/50",
  high: "border-orange-500/60",
  critical: "border-red-500/70",
};

const SEVERITY_BG: Record<string, string> = {
  low: "rgba(249,115,22,0.04)",
  medium: "rgba(234,179,8,0.04)",
  high: "rgba(249,115,22,0.05)",
  critical: "rgba(239,68,68,0.06)",
};

export function SignalList({
  signals,
  initialLimit = 4,
  showRecommendations = true,
}: {
  signals: Signal[];
  initialLimit?: number;
  showRecommendations?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? signals : signals.slice(0, initialLimit);
  const hidden = signals.length - visible.length;

  return (
    <div>
      <ul className="space-y-2.5">
        {visible.map((signal) => {
          const meta = SEVERITY_META[signal.severity];
          return (
            <li
              key={signal.id}
              className={cn(
                "rounded-xl border-l-2 px-4 py-3.5",
                SEVERITY_BORDER[signal.severity]
              )}
              style={{ background: SEVERITY_BG[signal.severity], border: "1px solid rgba(255,255,255,0.05)", borderLeftWidth: "2px", borderLeftColor: "" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={cn("mt-0.5 size-3.5 shrink-0", meta.text)} />
                  <h4 className="text-[13.5px] font-semibold text-white">
                    {signal.label}
                  </h4>
                </div>
                <SeverityBadge severity={signal.severity} />
              </div>
              {signal.evidence ? (
                <p className="mono mt-2 max-w-full overflow-hidden text-ellipsis rounded-lg border border-white/[0.06] bg-black/30 px-3 py-1.5 text-[11px] leading-5 text-stone-400">
                  {signal.evidence}
                </p>
              ) : null}
              <p className="mt-2 text-[13px] leading-6 text-stone-400">
                {signal.explanation}
              </p>
              {showRecommendations ? (
                <div className="mt-2 flex items-start gap-2">
                  <span className="mt-0.5 inline-block shrink-0 rounded border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                    Action
                  </span>
                  <p className="text-[12.5px] leading-6 text-stone-300">
                    {signal.recommendation}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hidden > 0 || showAll ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12.5px] font-semibold text-orange-400 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-orange-300"
        >
          {showAll ? (
            <>
              Show fewer <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              Show all {signals.length} warning signs <ChevronDown className="size-3.5" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
