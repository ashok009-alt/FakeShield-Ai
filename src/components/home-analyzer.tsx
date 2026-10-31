"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Info, Loader2, ScanText, Sparkles, RotateCcw, Copy } from "lucide-react";
import { analyzeMessage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { getMessageSample, messageSamples } from "@/lib/demo-data";
import { RISK_META, SEVERITY_META } from "@/lib/constants";
import { buildShareSummary } from "@/lib/report";
import { copyText, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScoreRing } from "@/components/score-ring";
import { ScoreExplainDialog } from "@/components/score-explain-dialog";
import { RiskBadge } from "@/components/risk-badge";
import { HudCorners } from "@/components/hud-corners";
import { Skeleton } from "@/components/ui/progress";

const QUICK_SAMPLES = ["kyc-block", "delivery-fee", "lottery"];

export function HomeAnalyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      busyRef.current = false;
    },
    []
  );

  async function run(input: string) {
    const trimmed = input.trim();
    if (trimmed.length < 10) {
      setError("Paste at least 10 characters so there is something to analyse.");
      textareaRef.current?.focus({ preventScroll: true });
      return;
    }
    if (busyRef.current) return;

    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeMessage(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      if (!data.id) {
        toast.warning("Analysed, but not saved", {
          description: "The history database could not be reached.",
        });
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Analysis failed.";
      setError(message);
      toast.error(message);
    } finally {
      if (abortRef.current === controller) {
        busyRef.current = false;
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function applySample(id: string) {
    const sample = getMessageSample(id);
    if (!sample) return;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      busyRef.current = false;
      setLoading(false);
    }
    setText(sample.text);
    setActiveSample(id);
    setResult(null);
    setError(null);
    textareaRef.current?.focus({ preventScroll: true });
  }

  return (
    <div
      className="relative overflow-hidden rounded-sm p-5 sm:p-6"
      style={{
        border: "1px solid rgba(249,115,22,0.15)",
        background: "linear-gradient(160deg, #201509 0%, #0f0906 100%)",
        boxShadow: "0 0 0 1px rgba(249,115,22,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.9)",
      }}
    >
      <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden="true" />
      <HudCorners />
      {loading ? <span className="scan-line" aria-hidden="true" /> : null}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[13px] font-bold text-white">
          <ScanText className="size-4 text-amber-400" />
          Live threat scanner
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#3a2a1c] bg-[#171009] px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-stone-500">
          <span className="live-dot" />
          READY
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(text);
        }}
      >
        <label htmlFor="home-message" className="sr-only">
          Suspicious message
        </label>
        <Textarea
          id="home-message"
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void run(text);
            }
          }}
          placeholder="Paste a suspicious SMS, WhatsApp message or link…"
          className="mt-3 min-h-[136px] resize-none text-[13px] leading-6"
          maxLength={10000}
          spellCheck={false}
        />

        {error ? (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
            <Sparkles className="size-3" />
            Try:
          </span>
          {QUICK_SAMPLES.map((id) => {
            const sample = getMessageSample(id);
            if (!sample) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applySample(id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  activeSample === id
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-300 font-semibold"
                    : "border-white/[0.08] bg-white/[0.02] text-stone-400 hover:border-white/[0.18] hover:text-stone-200"
                )}
              >
                {sample.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              const pool = messageSamples.filter((sample) => sample.id !== activeSample);
              applySample(pool[Math.floor(Math.random() * pool.length)]?.id ?? "kyc-block");
            }}
            className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-stone-400 transition-colors hover:border-white/[0.18] hover:text-stone-200"
          >
            Random
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <p className="hidden text-[11px] text-stone-500 sm:block">
            <kbd className="rounded-md border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="rounded-md border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
          </p>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                Analyze now
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      ) : result ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4"
          aria-live="polite"
        >
          <div className="flex items-start gap-4">
            <ScoreExplainDialog result={result} inputLength={text.trim().length}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Explain how the ${result.riskScore} out of 100 ${result.riskLevel} score was calculated`}
                className="group flex shrink-0 flex-col items-center gap-1 rounded-2xl p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <ScoreRing score={result.riskScore} level={result.riskLevel} size={92} />
                <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-stone-500 transition-colors group-hover:text-orange-300">
                  <Info className="size-2.5" />
                  How is this scored?
                </span>
              </button>
            </ScoreExplainDialog>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level={result.riskLevel} />
                <span className="text-[11px] text-stone-500">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-stone-300">{result.summary}</p>
            </div>
          </div>

          {result.signals.length > 0 ? (
            <ul className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
              {result.signals.slice(0, 3).map((signal) => (
                <li key={signal.id} className="flex items-start gap-2 text-[12px] leading-5 text-stone-400">
                  <span
                    className={cn(
                      "mt-[7px] size-1.5 shrink-0 rounded-full",
                      SEVERITY_META[signal.severity].dot
                    )}
                  />
                  {signal.label}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {result.id ? (
              <Button size="sm" asChild>
                <Link href={`/report/${result.id}`}>
                  Full report
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const ok = await copyText(buildShareSummary(result));
                if (ok) toast.success("Summary copied");
                else toast.error("Could not copy the summary.");
              }}
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setResult(null);
                setText("");
                setActiveSample(null);
                textareaRef.current?.focus();
              }}
            >
              <RotateCcw className="size-3.5" />
              Clear
            </Button>
            <span className={cn("ml-auto text-[10px]", RISK_META[result.riskLevel].text)}>
              {result.threatFeed === "verified" ? "Threat-feed verified" : "Heuristic analysis"}
            </span>
          </div>
        </motion.div>
      ) : null}

      <p className="mt-3 text-[10px] leading-4 text-stone-500">
        Risk guidance, not a final security verdict. Stored only in this demo&apos;s local history.
      </p>
    </div>
  );
}
