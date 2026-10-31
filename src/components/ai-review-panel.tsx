"use client";

import { BrainCircuit, Info, Sparkles, TriangleAlert } from "lucide-react";
import type { LlmAnalysis } from "@/lib/analysis/types";
import { SEVERITY_META } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Renders the optional Gemini review. Every state is explicit:
 *  - ok / cached: semantic score, reasoning, tactics and the blend;
 *  - error: what failed, with the rule result still standing;
 *  - not_configured: a short strip so it is obvious the site is running on
 *    rules alone (no fabricated AI claims).
 */
export function AiReviewPanel({ llm }: { llm?: LlmAnalysis }) {
  if (!llm) return null;

  if (llm.status === "not_configured") {
    return (
      <div className="surface flex items-start gap-3 rounded-2xl px-4 py-3">
        <BrainCircuit className="mt-0.5 size-4 shrink-0 text-stone-500" />
        <div>
          <p className="text-[12px] font-medium text-stone-300">Semantic review is off</p>
          <p className="mt-0.5 text-[11px] leading-5 text-stone-500">
            {llm.detail} Add{" "}
            <span className="mono text-stone-400">GEMINI_API_KEY</span> on the server to blend a
            Gemini reading with the rule engine. Nothing about the input is sent to Google while
            this is off.
          </p>
        </div>
      </div>
    );
  }

  if (llm.status === "error") {
    return (
      <div className="surface flex items-start gap-3 rounded-2xl border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <div>
          <p className="text-[12px] font-medium text-amber-200">Semantic review unavailable</p>
          <p className="mt-0.5 text-[11px] leading-5 text-stone-400">
            {llm.detail ?? "Gemini could not complete this review."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Gemini semantic review"
      className="surface relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="size-4 text-violet-300" />
          Semantic review
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neutral" title={`Model: ${llm.model}`}>
            Gemini · {llm.model}
          </Badge>
          {llm.status === "cached" ? <Badge variant="outline">Cached</Badge> : null}
          {typeof llm.semanticScore === "number" ? (
            <Badge variant="outline">
              <span className="tabular-nums">{llm.semanticScore}/100</span> semantic
            </Badge>
          ) : null}
        </div>
      </div>

      {llm.summary ? (
        <p className="mt-3 border-l-2 border-violet-400/40 pl-3 text-[13.5px] leading-6 text-stone-200">
          {llm.summary}
        </p>
      ) : null}

      {llm.reasoning.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {llm.reasoning.map((point, index) => {
            const meta = point.severity ? SEVERITY_META[point.severity] : null;
            return (
              <li key={`${point.title}-${index}`} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-[7px] size-1.5 shrink-0 rounded-full",
                    meta?.dot ?? "bg-violet-400"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-200">{point.title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-stone-400">{point.detail}</p>
                  {point.quote ? (
                    <p className="mono mt-1 rounded border-l border-white/10 bg-black/20 px-2 py-1 text-[10.5px] leading-5 text-stone-500">
                      “{point.quote}”
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {llm.tactics.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {llm.tactics.map((tactic) => (
            <span
              key={tactic}
              className="rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-2.5 py-1 text-[10.5px] font-medium text-violet-200/90"
            >
              {tactic}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-1.5 border-t border-border/60 pt-3 text-[10px] leading-5 text-stone-500">
        <Info className="mt-0.5 size-3 shrink-0" />
        <p>
          Gemini&apos;s 0–100 reading is blended with the rule-engine score (55% semantic / 45%
          rules, with a 20-point guardrail floor) and cannot lower a strongly flagged result below
          that floor. The submitted text is sent to Google&apos;s Generative Language API to produce
          this review; credential-like digit runs are redacted first. Results are cached for up to
          six hours.
        </p>
      </div>
    </section>
  );
}
