"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Fingerprint,
  KeyRound,
  Link2,
  Loader2,
  Play,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import { analyzeMessage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { getMessageSample } from "@/lib/demo-data";
import { DISCLAIMER_TEXT, RISK_META } from "@/lib/constants";
import { ScoreRing } from "@/components/score-ring";
import { ScoreExplainDialog } from "@/components/score-explain-dialog";
import { RiskBadge } from "@/components/risk-badge";
import { SignalList } from "@/components/signal-list";
import { BeforeAfterPanel } from "@/components/before-after-panel";
import { HudCorners } from "@/components/hud-corners";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SAMPLE = getMessageSample("kyc-block");
const SAMPLE_TEXT = SAMPLE?.text ?? "";

const STAGES = [
  {
    icon: Timer,
    label: "Normalising input",
    detail: "Trimming whitespace, detecting the channel",
  },
  {
    icon: Link2,
    label: "Extracting entities",
    detail: "Links, phone numbers, amounts and brand names",
  },
  {
    icon: Fingerprint,
    label: "Matching scam patterns",
    detail: "Urgency, fear, impersonation and payment bait",
  },
  {
    icon: KeyRound,
    label: "Weighing signals",
    detail: "Severity × category weights on a saturating curve",
  },
  {
    icon: ShieldAlert,
    label: "Calibrating confidence",
    detail: "Signal count, diversity and short-input caps",
  },
] as const;

type Phase = "running" | "done" | "error";

export function DemoClient() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("running");
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const autoStarted = useRef(false);

  const startDemo = useCallback(() => {
    if (!SAMPLE_TEXT) {
      setPhase("error");
      setError("The demo sample could not be loaded.");
      return;
    }

    const run = runRef.current + 1;
    runRef.current = run;
    abortRef.current?.abort();
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("running");
    setStage(0);
    setResult(null);
    setError(null);

    const isReduced = reducedMotion === true;
    const stepMs = isReduced ? 90 : 380;
    const minWait = isReduced ? 450 : 2200;

    STAGES.forEach((_, index) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (runRef.current === run) setStage(index + 1);
        }, stepMs * (index + 1))
      );
    });

    const delay = new Promise((resolve) => window.setTimeout(resolve, minWait));

    Promise.all([analyzeMessage(SAMPLE_TEXT, controller.signal), delay])
      .then(([data]) => {
        if (controller.signal.aborted || runRef.current !== run) return;
        setStage(STAGES.length);
        setResult(data);
        setPhase("done");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || runRef.current !== run) return;
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "The demo analysis failed.");
        setPhase("error");
      });
  }, [reducedMotion]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    startDemo();
  }, [startDemo]);

  useEffect(
    () => () => {
      runRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
    },
    []
  );

  const running = phase === "running";
  const progress = Math.round((Math.min(stage, STAGES.length) / STAGES.length) * 100);

  return (
    <div className="page-shell py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
          <Sparkles className="size-3" />
          Judge demo
        </span>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-orange-300"
        >
          Back to homepage
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Watch a scam get{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #fb923c 0%, #b45309 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            dissected.
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-stone-400">
          A pre-seeded banking KYC scam, run through the same server-side engine as the analyzer.
          No typing, no setup — the pipeline starts automatically.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Input card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            border: "1px solid rgba(251,146,60,0.12)",
            background:
              "linear-gradient(145deg, rgba(28,20,12,0.97) 0%, rgba(15,9,6,0.99) 100%)",
            boxShadow: "0 0 60px -24px rgba(251,146,60,0.15), 0 24px 80px -40px rgba(0,0,0,0.95)",
          }}
        >
          <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true" />
          <HudCorners />

          <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3.5">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
              <ScanLine className="size-4 text-orange-400" />
              Incoming SMS · sender unverified
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-stone-400">
              Demo sample
            </span>
          </div>

          <div className="relative p-5">
            {running ? <span className="scan-line" aria-hidden="true" /> : null}
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-black/30 p-4 font-mono text-[12.5px] leading-6 text-stone-300">
              {SAMPLE_TEXT}
            </pre>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <Link2 className="size-3" />
                Links parsed as text — never opened
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Timer className="size-3" />
                {running ? "Scanning now…" : "Scan complete"}
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline / verdict card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl",
            phase === "done" && "ring-1 ring-red-500/20"
          )}
          style={{
            border: "1px solid rgba(50,36,24,0.9)",
            background:
              "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)",
          }}
          aria-live="polite"
        >
          <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" />
          <HudCorners />

          <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3.5">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
              <Fingerprint className="size-4 text-orange-400" />
              Analysis pipeline
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider",
                running
                  ? "border-orange-500/25 bg-orange-500/10 text-orange-300"
                  : phase === "done"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/25 bg-red-500/10 text-red-300"
              )}
            >
              <span className={cn("live-dot", !running && "opacity-50")} />
              {running ? "Running" : phase === "done" ? "Complete" : "Failed"}
            </span>
          </div>

          {phase === "running" ? (
              <motion.div
                key="pipeline"
                initial={false}
                animate={{ opacity: 1 }}
                className="relative p-5"
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  <span>Stage {Math.min(stage + 1, STAGES.length)} of {STAGES.length}</span>
                  <span className="font-mono tabular-nums text-stone-400">{progress}%</span>
                </div>
                <Progress value={progress} className="mt-1.5" indicatorClassName="bg-orange-400" label="Pipeline progress" />

                <ol className="mt-4 space-y-1">
                  {STAGES.map((item, index) => {
                    const complete = index < stage;
                    const active = index === stage;
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className={cn(
                          "flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors",
                          active && "bg-orange-500/[0.06]"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
                            complete
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : active
                                ? "border-orange-500/35 bg-orange-500/10 text-orange-300"
                                : "border-white/[0.08] bg-white/[0.02] text-stone-600"
                          )}
                        >
                          {complete ? (
                            <Check className="size-3.5" />
                          ) : active ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Icon className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-[12.5px] font-semibold leading-5",
                              complete ? "text-stone-300" : active ? "text-white" : "text-stone-500"
                            )}
                          >
                            {item.label}
                          </p>
                          <p className="text-[10.5px] leading-4 text-stone-600">{item.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] leading-4 text-stone-600">
                  Processed on the server. The submitted text is treated as untrusted and is never
                  rendered as live HTML or opened in a browser.
                </p>
              </motion.div>
            ) : phase === "done" && result ? (
              <motion.div
                key="verdict"
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative p-5"
              >
                {!reducedMotion ? (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-red-500/20"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                ) : null}

                <div className="relative flex items-start gap-4">
                  <ScoreExplainDialog result={result} inputLength={SAMPLE_TEXT.length}>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-label={`Explain how the ${result.riskScore} out of 100 ${result.riskLevel} score was calculated`}
                      className="group flex shrink-0 flex-col items-center gap-1.5 rounded-2xl p-1 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
                    >
                      <ScoreRing score={result.riskScore} level={result.riskLevel} size={140} />
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500 transition-colors group-hover:text-orange-300">
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
                    <p className="mt-2 text-[13.5px] leading-6 text-stone-300">{result.summary}</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10.5px] text-stone-500">
                        <span>Confidence</span>
                        <span className="font-semibold tabular-nums text-stone-300">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.round(result.confidence * 100)}
                        className="mt-1"
                        indicatorClassName={RISK_META[result.riskLevel].bar}
                        label="Confidence estimate"
                      />
                    </div>
                    <p className="mt-3 text-[10.5px] leading-5 text-stone-500">
                      {result.signals.length} signals across a critical verdict — the same arithmetic
                      as every other scan, recomputable step by step.
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  {result.id ? (
                    <Button size="sm" asChild>
                      <Link href={`/report/${result.id}`}>
                        Open full report
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="secondary" onClick={startDemo}>
                    <RotateCcw className="size-3.5" />
                    Replay demo
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/analyze">
                      <Play className="size-3.5" />
                      Try your own message
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={false}
                animate={{ opacity: 1 }}
                className="relative p-5"
              >
                <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
                  <div>
                    <p className="text-[13px] font-semibold text-red-200">The demo could not run</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-stone-400">
                      {error ?? "Something went wrong while analysing the sample."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={startDemo}>
                    <RotateCcw className="size-3.5" />
                    Try again
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href="/analyze">Open the analyzer</Link>
                  </Button>
                </div>
              </motion.div>
            )}
        </div>
      </div>

      {phase === "done" && result ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.35 }}
          className="mt-6 space-y-5"
        >
          <BeforeAfterPanel text={SAMPLE_TEXT} result={result} />

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                border: "1px solid rgba(50,36,24,0.9)",
                background:
                  "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Warning signs detected</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-300">
                  {result.signals.length} found
                </span>
              </div>
              <SignalList signals={result.signals} initialLimit={4} showRecommendations />
            </div>

            <div className="space-y-4">
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{
                  border: "1px solid rgba(251,146,60,0.12)",
                  background: "rgba(251,146,60,0.04)",
                }}
              >
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="grid size-5 place-items-center rounded-full border border-orange-500/25 bg-orange-500/15">
                    <span className="size-1.5 rounded-full bg-orange-400" />
                  </span>
                  Recommended actions
                </h2>
                <ol className="mt-4 space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={recommendation} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-orange-500/25 bg-orange-500/10 text-[11px] font-bold text-orange-300">
                        {index + 1}
                      </span>
                      <p className="text-[12.5px] leading-6 text-stone-300">{recommendation}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-border/60 px-4 py-3">
                <p className="flex items-start gap-2 text-[10.5px] leading-5 text-stone-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {DISCLAIMER_TEXT} This demo is a fixed sample; the engine never opens a submitted
                  link.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
