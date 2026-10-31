"use client";

import { useMemo } from "react";
import { Calculator } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildScoreBreakdown } from "@/lib/score-breakdown";
import { DISCLAIMER_TEXT, RISK_META, SEVERITY_META } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Click through from the score ring to a full, auditable derivation of the
 * 0–100 score: raw weights, the saturating curve, severity bonuses, the
 * resulting band, and how confidence was calibrated.
 */
export function ScoreExplainDialog({
  result,
  inputLength,
  children,
}: {
  result: AnalysisResult;
  inputLength?: number;
  children: React.ReactNode;
}) {
  const breakdown = useMemo(
    () => buildScoreBreakdown(result, inputLength),
    [result, inputLength]
  );
  const meta = RISK_META[result.riskLevel];
  const confidencePct = Math.round(breakdown.confidence * 100);
  const baseConfidencePct = Math.round(breakdown.confidenceComputed * 100);
  const confidenceDelta = confidencePct - baseConfidencePct;
  const finalRaw = breakdown.base + breakdown.bonusTotal;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-4 text-orange-300" />
            How this score was calculated
          </DialogTitle>
          <DialogDescription>
            Every point is traceable to a named signal.{" "}
            {breakdown.hybrid
              ? "The rule-engine subtotal is then blended with Gemini's semantic reading, and both steps are shown."
              : "The same arithmetic runs on the server for every analysis — there is no hidden model."}
          </DialogDescription>
        </DialogHeader>

        {/* Verdict summary */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3.5">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-black tabular-nums leading-none", meta.text)}>
              {breakdown.score}
            </span>
            <span className="text-sm text-stone-500">/ 100</span>
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-widest",
              meta.border,
              meta.bg,
              meta.text
            )}
          >
            {meta.label}
          </span>
          <div className="ml-auto flex items-center gap-5 text-center">
            <SummaryStat value={breakdown.signalCount} label="Signals" />
            <SummaryStat value={breakdown.categoryCount} label="Categories" />
            <SummaryStat value={`${confidencePct}%`} label="Confidence" />
          </div>
        </div>

        <ol className="space-y-2.5">
          <Step n={1} title="Add up the signal weights">
            <p>
              {breakdown.signalCount} distinct signal{breakdown.signalCount === 1 ? "" : "s"},
              each carrying a severity weight — {breakdown.rawWeight} points of raw weight in total.
            </p>
            {breakdown.categories.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {breakdown.categories.map((category) => (
                  <span
                    key={category.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10.5px] text-stone-400"
                  >
                    <span className="truncate">{category.label}</span>
                    <span className="font-mono tabular-nums text-stone-300">
                      {category.weight}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </Step>

          <Step n={2} title="Compress onto a 100-point curve">
            <code className="block rounded-md border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-[11px] text-amber-200/90">
              100 × (1 − e^(−{breakdown.rawWeight}/40)) = {breakdown.base.toFixed(1)}
            </code>
            <p className="mt-1.5">
              Weighted evidence adds up quickly but saturates before 100, so one weak signal can
              never carry a Critical verdict on its own.
            </p>
          </Step>

          <Step n={3} title="Add severity bonuses">
            <ul className="grid gap-1.5 sm:grid-cols-3">
              {breakdown.bonuses.map((bonus) => (
                <li
                  key={bonus.label}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-[10.5px] leading-4",
                    bonus.applied
                      ? "border-orange-500/25 bg-orange-500/[0.07] text-orange-200"
                      : "border-white/[0.06] bg-white/[0.015] text-stone-500"
                  )}
                >
                  <span className="block font-semibold">
                    {bonus.applied ? `+${bonus.points}` : "+0"} · {bonus.label}
                  </span>
                  <span className="text-[9.5px] opacity-80">
                    {bonus.detail}
                    {bonus.applied ? "" : " — not met"}
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          <Step n={4} title="Round, cap and map to a band">
            <code className="block rounded-md border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-[11px] text-amber-200/90">
              {breakdown.base.toFixed(1)} + {breakdown.bonusTotal} = {finalRaw.toFixed(1)} →{" "}
              {breakdown.computedScore}/100
            </code>
            <p className="mt-1.5">
              {breakdown.hybrid
                ? "This is the rule-engine subtotal, before the semantic review is blended in."
                : "Bands: 0–24 Low · 25–49 Medium · 50–74 High · 75–100 Critical. This result lands in "}
              {breakdown.hybrid ? null : (
                <span className={cn("font-bold", meta.text)}>{meta.label}</span>
              )}
              {breakdown.hybrid ? null : "."}
            </p>
          </Step>

          {breakdown.hybrid ? (
            <Step n={5} title="Blend with the Gemini review">
              <code className="block rounded-md border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-[11px] text-violet-200/90">
                round(0.55 × {breakdown.hybrid.semanticScore} + 0.45 ×{" "}
                {breakdown.hybrid.ruleScore}) = {breakdown.hybrid.blended}
              </code>
              <p className="mt-1.5">
                The lower bound is the rule score minus 20 points (guardrail floor{" "}
                {breakdown.hybrid.floor}). {breakdown.hybrid.floorApplied
                  ? `The blend of ${breakdown.hybrid.blended} was below the floor, so it was raised to ${breakdown.hybrid.final}.`
                  : `The blend of ${breakdown.hybrid.blended} sits inside the guardrail, so the final score is ${breakdown.hybrid.final}.`}{" "}
                Bands: 0–24 Low · 25–49 Medium · 50–74 High · 75–100 Critical →{" "}
                <span className={cn("font-bold", meta.text)}>{meta.label}</span>.
              </p>
              <p className="mt-1 text-[10px] text-stone-500">
                Gemini model: <span className="mono">{breakdown.hybrid.model}</span>
                {breakdown.hybrid.status === "cached" ? " (cached review)" : ""}
              </p>
            </Step>
          ) : null}
        </ol>

        {/* Signal ledger */}
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
            Signal ledger
          </h3>
          {breakdown.signals.length > 0 ? (
            <ul className="mt-2 max-h-52 divide-y divide-white/[0.05] overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20">
              {breakdown.signals.map((signal) => (
                <li key={signal.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      SEVERITY_META[signal.severity].dot
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-stone-300">
                    {signal.label}
                  </span>
                  <span className="shrink-0 text-[9px] uppercase tracking-wider text-stone-600">
                    {signal.severity}
                  </span>
                  <span className="w-9 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-stone-400">
                    +{signal.weight}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3 text-[11.5px] text-stone-500">
              No signal fired, so the score is 0 and the baseline confidence applies.
            </p>
          )}
        </div>

        {/* Confidence */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400">
              Confidence calibration
            </h3>
            <span className="font-mono text-[11px] font-bold tabular-nums text-stone-200">
              {confidencePct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn("h-full rounded-full", meta.bar)}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <ul className="mt-2.5 space-y-1 text-[10.5px] leading-4 text-stone-500">
            {breakdown.confidenceFactors.map((factor) => (
              <li key={factor} className="flex items-start gap-1.5">
                <span className="mt-[6px] size-1 shrink-0 rounded-full bg-stone-600" />
                {factor}
              </li>
            ))}
            {breakdown.hybrid ? (
              <li className="flex items-start gap-1.5 text-violet-300/80">
                <span className="mt-[6px] size-1 shrink-0 rounded-full bg-violet-400" />
                Blended 55/45 with Gemini&apos;s semantic confidence
                {typeof breakdown.hybrid.semanticConfidence === "number"
                  ? ` (${Math.round(breakdown.hybrid.semanticConfidence * 100)}%)`
                  : ""}
                , which moved the final confidence to {confidencePct}%.
              </li>
            ) : confidenceDelta > 1 ? (
              <li className="flex items-start gap-1.5 text-orange-300/80">
                <span className="mt-[6px] size-1 shrink-0 rounded-full bg-orange-400" />
                External threat-feed verification added {confidenceDelta} percentage point
                {confidenceDelta === 1 ? "" : "s"} of confidence.
              </li>
            ) : null}
            <li className="flex items-start gap-1.5">
              <span className="mt-[6px] size-1 shrink-0 rounded-full bg-stone-600" />
              Confidence is bounded to 50–95% — the engine never claims certainty.
            </li>
          </ul>
        </div>

        <p className="text-[10.5px] leading-5 text-stone-600">{DISCLAIMER_TEXT}</p>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-base font-bold leading-none tabular-nums text-white">{value}</p>
      <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-orange-500/25 bg-orange-500/10 text-[10px] font-black text-orange-300">
          {n}
        </span>
        <h3 className="text-[12px] font-bold text-white">{title}</h3>
      </div>
      <div className="mt-2 space-y-1 pl-7 text-[11px] leading-5 text-stone-400">{children}</div>
    </li>
  );
}
