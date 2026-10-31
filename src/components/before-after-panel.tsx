"use client";

import { Columns2, EyeOff, Highlighter } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { AnnotatedMessage } from "@/components/annotated-message";
import { HudCorners } from "@/components/hud-corners";
import { cn } from "@/lib/utils";

/**
 * Side-by-side view of the raw message and the annotated version where each
 * detected signal's stored evidence is highlighted by severity. Text only —
 * links inside the message are never rendered as clickable or opened.
 */
export function BeforeAfterPanel({
  text,
  result,
  className,
}: {
  text: string;
  result: AnalysisResult;
  className?: string;
}) {
  const trimmed = text.trim();
  if (!trimmed || result.inputType === "url") return null;

  return (
    <section
      aria-label="Before and after annotation"
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        border: "1px solid rgba(50,36,24,0.9)",
        background:
          "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)",
      }}
    >
      <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" />
      <HudCorners />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-[13px] font-bold text-white">
          <Columns2 className="size-4 text-orange-400" />
          Before &amp; after
        </h3>
        <p className="flex items-center gap-1.5 text-[10.5px] text-stone-500">
          <Highlighter className="size-3 text-amber-400" />
          Threat phrases marked by severity — nothing in the text is clickable
        </p>
      </div>

      <div className="relative grid gap-3 p-5 sm:p-6 md:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
              Original message
            </span>
            <span className="text-[9.5px] text-stone-600">as submitted</span>
          </div>
          <div className="max-h-[360px] flex-1 overflow-auto rounded-xl border border-border/60 bg-black/25 p-3.5">
            <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-stone-300">
              {trimmed}
            </pre>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/90">
              Annotated
            </span>
            <span className="text-[9.5px] text-stone-600">evidence from the rule engine</span>
          </div>
          <AnnotatedMessage text={trimmed} result={result} />
        </div>
      </div>

      <div className="relative border-t border-white/[0.06] px-5 py-3 sm:px-6">
        <p className="flex items-start gap-1.5 text-[10px] leading-4 text-stone-600">
          <EyeOff className="mt-0.5 size-3 shrink-0" />
          Red = critical, orange = high, amber = medium severity. Highlights show exactly which
          words contributed to the score; they are not proof that the sender is fraudulent.
        </p>
      </div>
    </section>
  );
}
