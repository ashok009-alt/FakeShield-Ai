"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Forward,
  Loader2,
  Minus,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { analyzeForward } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { computeForwardChain, FORWARD_SIGNAL_IDS, type ChainAssessment } from "@/lib/forward";
import { forwardSamples } from "@/lib/data/forward-samples";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ResultPanel } from "@/components/result-panel";
import { ResultSkeleton } from "@/components/result-skeleton";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { cn } from "@/lib/utils";

const MAX_CHARS = 4000;

export function ForwardDetectorClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const chain = useMemo(
    () => (result ? computeForwardChain(result.signals) : null),
    [result]
  );

  function loadSample(id: string) {
    const sample = forwardSamples.find((item) => item.id === id);
    if (!sample) return;
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    setText(sample.text);
    setActiveSample(id);
    setResult(null);
    setError(null);
  }

  async function run() {
    const trimmed = text.trim();
    if (trimmed.length < 12) {
      setError("Paste the full forwarded message so the chain wording can be checked.");
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
      const data = await analyzeForward(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      if (data.id) toast.success("Forward check saved to history");
      else toast.warning("Checked, but not saved", { description: "The history database could not be reached." });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Forward check failed.";
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

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
    setText("");
    setResult(null);
    setError(null);
    setActiveSample(null);
  }

  const overLimit = text.length > MAX_CHARS;

  return (
    <div className="space-y-6">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label htmlFor="forward-input" className="text-sm font-semibold text-foreground">
              Paste the forwarded message
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Include lines like “Forwarded many times”, blessings, or “share with 10 people” — those
              are the fingerprints the detector looks for.
            </p>
          </div>
          <Badge variant="outline">
            <Forward className="size-3" />
            Chain detector
          </Badge>
        </div>

        <Textarea
          id="forward-input"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void run();
            }
          }}
          placeholder={"Forwarded many times\n\nURGENT: Share this with 10 people before midnight…"}
          rows={8}
          maxLength={MAX_CHARS + 200}
          className="mt-3 min-h-[180px] resize-y font-mono text-[13px] leading-6"
          aria-invalid={Boolean(error) || overLimit}
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-[11px]", overLimit ? "text-red-300" : "text-stone-500")}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            {overLimit ? " — trim it before checking" : ""}
          </p>
          <Button
            type="button"
            onClick={() => void run()}
            disabled={loading || overLimit}
            className="h-11 min-w-44"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Checking chain…
              </>
            ) : (
              <>
                <ScanLine className="size-4" />
                Check this forward
              </>
            )}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <Button size="sm" variant="secondary" type="button" onClick={() => loadSample(forwardSamples[0].id)}>
            <Sparkles className="size-3.5" />
            Try a sample
          </Button>
          <span className="text-[11px] text-stone-500">or pick one:</span>
          {forwardSamples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                activeSample === sample.id
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                  : "border-border bg-white/[0.02] text-stone-400 hover:border-stone-600 hover:text-stone-200"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  sample.id === "real-message" ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ResultSkeleton />
          <div className="surface space-y-4 rounded-2xl p-6">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      ) : result && chain ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ResultPanel result={result} onReset={reset} inputLength={text.trim().length} />
          <div className="space-y-4 lg:sticky lg:top-32">
            <ChainPanel chain={chain} result={result} />
            <div className="surface rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground">How to check a forward</h3>
              <ol className="mt-3 space-y-2.5 text-[12px] leading-5 text-stone-400">
                <li className="flex gap-2">
                  <span className="mono text-[10px] text-orange-300">01</span>
                  Search the exact first sentence — chain messages are copied word for word.
                </li>
                <li className="flex gap-2">
                  <span className="mono text-[10px] text-orange-300">02</span>
                  Look for a named, linkable source. “WhatsApp forward” is not a source.
                </li>
                <li className="flex gap-2">
                  <span className="mono text-[10px] text-orange-300">03</span>
                  If it asks you to forward before a deadline, treat the claim as unverified.
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <AnalyzerEmptyState
          icon={Forward}
          title="Spread risk and scam risk are different"
          description="A message can be harmless but still be a chain letter — or a real scam hiding inside a viral forward. FakeShield scores both, separately, so you know whether to doubt the claim or the sender."
          steps={[
            "Paste the message exactly as you received it, including the forward banner text.",
            "Read the chain meter to see how strongly it is built to spread.",
            "Read the risk score for requests involving money, codes or personal data.",
          ]}
        />
      )}
    </div>
  );
}

function ChainPanel({ chain, result }: { chain: ChainAssessment; result: AnalysisResult }) {
  const forwardSignals = result.signals.filter((signal) => FORWARD_SIGNAL_IDS.has(signal.id));
  const scamSignals = result.signals.filter(
    (signal) => !forwardSignals.some((forward) => forward.id === signal.id)
  );
  const tone =
    chain.score >= 70
      ? { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/25", dot: "bg-red-400" }
      : chain.score >= 35
        ? { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/25", dot: "bg-amber-400" }
        : { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-400" };

  const segments = [
    { max: 34, label: "Normal" },
    { max: 69, label: "Likely chain" },
    { max: 100, label: "Heavy chain" },
  ];
  const activeSegment = chain.score >= 70 ? 2 : chain.score >= 35 ? 1 : 0;

  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Forward-chain likelihood</h3>
          <p className="mt-0.5 text-[11px] text-stone-500">How strongly the wording is built to spread</p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone.border, tone.bg, tone.text)}>
          <span className={cn("size-1.5 rounded-full", tone.dot)} />
          {chain.label}
        </span>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <span className={cn("text-5xl font-semibold tabular-nums tracking-tight", tone.text)}>
          {chain.score}
        </span>
        <span className="mb-1.5 text-xs text-stone-500">/ 100 chain score</span>
      </div>

      <div className="mt-4">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out", chain.score >= 70 ? "bg-red-400" : chain.score >= 35 ? "bg-amber-400" : "bg-emerald-400")}
            style={{ width: `${Math.max(3, chain.score)}%` }}
          />
          <span className="absolute inset-y-0 left-[35%] w-px bg-black/40" />
          <span className="absolute inset-y-0 left-[70%] w-px bg-black/40" />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-stone-500">
          {segments.map((segment, index) => (
            <span key={segment.label} className={cn(index === activeSegment ? "text-stone-300" : "")}>
              {segment.label}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[12.5px] leading-6 text-stone-400">{chain.explanation}</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Chain markers</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-stone-200">
            <Users className={cn("size-4", tone.text)} />
            {chain.markerCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Scam signals</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-stone-200">
            {result.riskScore >= 50 ? (
              <ShieldAlert className="size-4 text-red-300" />
            ) : result.riskScore >= 25 ? (
              <Minus className="size-4 text-amber-300" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-300" />
            )}
            {scamSignals.length}
          </p>
        </div>
      </div>

      {forwardSignals.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
          {forwardSignals.map((signal) => (
            <li key={signal.id} className="flex items-start gap-2 text-[12px] leading-5">
              <ArrowDownRight className="mt-0.5 size-3.5 shrink-0 text-orange-300" />
              <span className="text-stone-300">
                <span className="font-medium text-stone-200">{signal.label}</span>
                {signal.evidence ? (
                  <span className="mono ml-1 break-all text-[11px] text-stone-500">“{signal.evidence}”</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 flex items-start gap-2 border-t border-border/60 pt-4 text-[12px] leading-5 text-emerald-200/80">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          No forward-bait wording was detected. Still verify anything asking for money or codes.
        </p>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-[10.5px] leading-5 text-stone-500">
        <Clock3 className="mt-0.5 size-3 shrink-0" />
        The chain score measures spread-bait wording only. A low chain score is not proof the claim is true.
      </p>
    </div>
  );
}

export function ChainLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-stone-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-400" /> Under 35 — normal wording
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-amber-400" /> 35–69 — likely chain
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-red-400" /> 70+ — heavy chain
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ArrowUpRight className="size-3" /> Scores rise with each marker found
      </span>
    </div>
  );
}
