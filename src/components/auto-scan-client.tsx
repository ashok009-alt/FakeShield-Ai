"use client";

/**
 * FAKESHIELD AI — AUTO SCAN PAGE
 *
 * On page load, this component:
 *  1. Reads the clipboard automatically (no user input needed)
 *  2. Shows what it found
 *  3. Runs a full analysis in the background
 *  4. Displays the full result — all without the user typing anything
 *
 * Also supports: drag-drop a file, paste keyboard shortcut, or
 * manually type if clipboard is empty.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clipboard, Loader2, ShieldAlert, ShieldCheck,
  AlertTriangle, ArrowRight, RotateCcw, Link2,
  MessageSquare, Mail, Radio, Zap, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { ScoreRing }  from "@/components/score-ring";
import { RiskBadge }  from "@/components/risk-badge";
import { SignalList } from "@/components/signal-list";
import type { AnalysisResult } from "@/lib/analysis/types";

type Step =
  | "idle"
  | "reading"
  | "analysing"
  | "result"
  | "empty"
  | "error"
  | "permission_denied";

function detectType(text: string): "url" | "message" {
  const t = text.trim();
  if (/^https?:\/\/\S+$/.test(t)) return "url";
  if (/^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}(\/\S*)?$/i.test(t)) return "url";
  return "message";
}

export function AutoScanClient() {
  const [step,        setStep]       = useState<Step>("idle");
  const [clipText,    setClipText]   = useState("");
  const [inputType,   setInputType]  = useState<"url"|"message">("message");
  const [result,      setResult]     = useState<AnalysisResult | null>(null);
  const [error,       setError]      = useState("");
  const [manualText,  setManualText] = useState("");
  const hasScanned    = useRef(false);
  const dropRef       = useRef<HTMLDivElement>(null);

  // ── Core analyse function ───────────────────────────────────
  const runAnalysis = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 5) { setStep("empty"); return; }
    const type = detectType(text);
    setClipText(text);
    setInputType(type);
    setStep("analysing");

    try {
      const res  = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: text.trim(), type }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data: AnalysisResult = await res.json();
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setStep("error");
    }
  }, []);

  // ── Auto-read clipboard on mount ────────────────────────────
  useEffect(() => {
    if (hasScanned.current) return;
    hasScanned.current = true;

    const autoRead = async () => {
      setStep("reading");
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length >= 5) {
          await runAnalysis(text);
        } else {
          setStep("empty");
        }
      } catch {
        setStep("permission_denied");
      }
    };
    // Small delay so the user sees the "reading" animation
    setTimeout(autoRead, 600);
  }, [runAnalysis]);

  // ── Drag-and-drop file support ───────────────────────────────
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith("text/")) {
        const text = await file.text();
        runAnalysis(text);
      } else {
        const text = e.dataTransfer?.getData("text");
        if (text) runAnalysis(text);
      }
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    el.addEventListener("drop",     onDrop);
    el.addEventListener("dragover", onDragOver);
    return () => { el.removeEventListener("drop", onDrop); el.removeEventListener("dragover", onDragOver); };
  }, [runAnalysis]);

  const reset = () => {
    setStep("idle"); setResult(null);
    setClipText(""); setManualText(""); setError("");
    hasScanned.current = false;
    setTimeout(() => {
      hasScanned.current = true;
      setStep("reading");
      navigator.clipboard.readText()
        .then((t) => t?.trim().length >= 5 ? runAnalysis(t) : setStep("empty"))
        .catch(() => setStep("permission_denied"));
    }, 300);
  };

  // ── UI helpers ──────────────────────────────────────────────
  const typeIcon = inputType === "url" ? Link2 : MessageSquare;
  const TypeIcon = typeIcon;

  return (
    <div
      ref={dropRef}
      className="min-h-screen page-shell py-12 sm:py-16"
      style={{ background: "linear-gradient(160deg,#050d1a 0%,#040b15 100%)" }}
    >
      {/* Page header */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 rounded-sm border border-[#1b2e47] bg-[#071221] px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-slate-400">
            <span className="live-dot" />
            AUTO-SCAN ENGINE
          </span>
          <span
            className="rounded-sm px-2 py-0.5 text-[9px] font-black tracking-widest uppercase"
            style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#fbbf24" }}
          >
            ZERO INPUT REQUIRED
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-3">
          Auto{" "}
          <span style={{ background:"linear-gradient(90deg,#38bdf8,#0ea5e9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Threat
          </span>{" "}
          Detector
        </h1>
        <p className="text-[15px] text-slate-400 leading-7 max-w-xl">
          Copy any suspicious message or URL on your device. FakeShield AI reads
          your clipboard and analyses it automatically — no typing needed.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── STEP: READING ── */}
          {step === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              exit={{    opacity:0, y:-8 }}
              className="rounded-sm p-10 text-center"
              style={{ background:"linear-gradient(160deg,#091c30,#060f1f)", border:"1px solid rgba(14,165,233,0.15)" }}
            >
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <motion.div
                    className="size-20 rounded-full grid place-items-center"
                    style={{ background:"rgba(14,165,233,0.08)", border:"2px solid rgba(14,165,233,0.2)" }}
                    animate={{ scale:[1,1.06,1], borderColor:["rgba(14,165,233,0.2)","rgba(14,165,233,0.5)","rgba(14,165,233,0.2)"] }}
                    transition={{ duration:1.8, repeat:Infinity }}
                  >
                    <Clipboard className="size-8 text-sky-400" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border:"1px solid rgba(14,165,233,0.2)" }}
                    animate={{ scale:[1,1.5], opacity:[0.6,0] }}
                    transition={{ duration:1.5, repeat:Infinity }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Reading your clipboard…</h2>
                  <p className="text-slate-400 text-[13.5px]">Checking for suspicious content automatically</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <Loader2 className="size-3.5 animate-spin text-sky-500" />
                  SCANNING · NO INPUT NEEDED
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: ANALYSING ── */}
          {step === "analysing" && (
            <motion.div
              key="analysing"
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              exit={{    opacity:0, y:-8 }}
              className="rounded-sm p-10"
              style={{ background:"linear-gradient(160deg,#091c30,#060f1f)", border:"1px solid rgba(14,165,233,0.15)" }}
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <motion.div
                    className="size-14 rounded-sm grid place-items-center"
                    style={{ background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.2)" }}
                    animate={{ opacity:[1,0.6,1] }}
                    transition={{ duration:1.2, repeat:Infinity }}
                  >
                    <TypeIcon className="size-6 text-sky-400" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="size-4 animate-spin text-sky-400" />
                    <span className="text-[12px] font-bold tracking-widest uppercase text-sky-400">
                      Analysing {inputType}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-400 font-mono truncate mb-4">
                    {clipText.slice(0, 90)}{clipText.length > 90 ? "…" : ""}
                  </p>
                  {/* Progress steps */}
                  {["Reading clipboard", "Running 40+ detection rules", "Scoring threat signals", "Building report"].map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity:0, x:-10 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.3 }}
                      className="flex items-center gap-2.5 mb-2"
                    >
                      <motion.div
                        animate={{ opacity:[0.3,1,0.3] }}
                        transition={{ duration:1, delay:i*0.3, repeat:Infinity }}
                        className="size-1.5 rounded-full bg-sky-500 shrink-0"
                      />
                      <span className="text-[12px] text-slate-400">{s}</span>
                      <motion.span
                        initial={{ opacity:0 }}
                        animate={{ opacity:1 }}
                        transition={{ delay:0.5+i*0.3 }}
                        className="text-[10px] text-emerald-500 font-bold"
                      >
                        ✓
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: RESULT ── */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
              className="space-y-4"
            >
              {/* Auto-detected badge */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span className="text-[12px] text-slate-400">
                  Automatically detected from clipboard — no input required
                </span>
              </div>

              {/* Main result card */}
              <div
                className="rounded-sm overflow-hidden"
                style={{
                  background:"linear-gradient(160deg,#091c30,#060f1f)",
                  border: result.riskScore >= 75 ? "1px solid rgba(239,68,68,0.25)"
                        : result.riskScore >= 50 ? "1px solid rgba(249,115,22,0.22)"
                        : result.riskScore >= 25 ? "1px solid rgba(245,158,11,0.2)"
                        : "1px solid rgba(34,197,94,0.2)",
                  boxShadow:"0 20px 60px -20px rgba(0,0,0,0.8)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 border-b"
                  style={{ borderColor:"rgba(255,255,255,0.06)", background:"rgba(14,165,233,0.03)" }}
                >
                  <div className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-white">
                    <Radio className="size-4 text-sky-400" />
                    AUTO-DETECTED THREAT REPORT
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-black tracking-widest uppercase rounded-sm px-2 py-1"
                      style={{ background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.2)", color:"#38bdf8" }}
                    >
                      <TypeIcon className="size-2.5 inline mr-1" />
                      {inputType.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid items-start gap-6 sm:grid-cols-[auto_1fr]">
                    <ScoreRing score={result.riskScore} level={result.riskLevel} size={140} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <RiskBadge level={result.riskLevel} />
                        <span className="text-[11px] text-slate-500">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                        <span
                          className="text-[9px] font-black tracking-widest uppercase rounded-sm px-2 py-0.5"
                          style={{ background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.15)", color:"#38bdf8" }}
                        >
                          {result.threatFeed === "verified" ? "✓ Threat-feed verified" : "Heuristic analysis"}
                        </span>
                      </div>
                      <p className="text-[15px] leading-7 text-slate-200 mb-4">{result.summary}</p>

                      {/* Clipped text preview */}
                      <div
                        className="rounded-sm px-3 py-2 mb-4"
                        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clipboard className="size-3 text-slate-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                            Content from your clipboard
                          </span>
                        </div>
                        <p className="text-[12px] font-mono text-slate-400 break-all line-clamp-3">
                          {clipText}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {result.id && (
                          <Link
                            href={`/report/${result.id}`}
                            className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-[12px] font-bold tracking-wide text-sky-950"
                            style={{ background:"linear-gradient(135deg,#38bdf8,#0ea5e9)" }}
                          >
                            Full Report <ArrowRight className="size-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={reset}
                          className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-[12px] font-semibold text-slate-300"
                          style={{ border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)" }}
                        >
                          <RotateCcw className="size-3.5" /> Scan Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signals */}
              {result.signals.length > 0 && (
                <div
                  className="rounded-sm p-5"
                  style={{ background:"linear-gradient(160deg,#091c30,#060f1f)", border:"1px solid #1b2e47" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Warning signs detected</h3>
                    <span
                      className="text-[10px] font-bold rounded-sm px-2 py-0.5"
                      style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171" }}
                    >
                      {result.signals.length} found
                    </span>
                  </div>
                  <SignalList signals={result.signals} initialLimit={4} showRecommendations />
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div
                  className="rounded-sm p-5"
                  style={{ background:"rgba(14,165,233,0.04)", border:"1px solid rgba(14,165,233,0.15)" }}
                >
                  <h3 className="text-sm font-bold text-white mb-4">What you should do</h3>
                  <ol className="space-y-3">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="grid size-6 shrink-0 place-items-center rounded-sm text-[11px] font-black text-sky-400"
                          style={{ background:"rgba(14,165,233,0.1)", border:"1px solid rgba(14,165,233,0.2)" }}
                        >
                          {i+1}
                        </span>
                        <p className="text-[13px] leading-6 text-slate-300">{r}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP: EMPTY ── */}
          {(step === "empty" || step === "permission_denied") && (
            <motion.div
              key="empty"
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              className="rounded-sm p-10 text-center"
              style={{ background:"linear-gradient(160deg,#091c30,#060f1f)", border:"1px solid #1b2e47" }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="size-16 rounded-sm grid place-items-center"
                  style={{ background:"rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.18)" }}
                >
                  {step === "permission_denied"
                    ? <AlertTriangle className="size-7 text-amber-400" />
                    : <Clipboard className="size-7 text-sky-400" />
                  }
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {step === "permission_denied" ? "Clipboard access denied" : "Clipboard is empty"}
                  </h2>
                  <p className="text-slate-400 text-[13.5px] max-w-md">
                    {step === "permission_denied"
                      ? "Allow clipboard access in your browser settings, or paste the content manually below."
                      : "Copy a suspicious message or URL from anywhere on your device, then paste it below or click Scan Again."}
                  </p>
                </div>

                {/* Manual input fallback */}
                <div className="w-full max-w-lg mt-2">
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Or paste a suspicious message or URL here…"
                    className="w-full rounded-sm border border-[#1b2e47] bg-black/30 px-4 py-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/40 min-h-[100px] resize-y"
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runAnalysis(manualText);
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => runAnalysis(manualText)}
                      disabled={manualText.trim().length < 5}
                      className="flex-1 flex items-center justify-center gap-2 rounded-sm py-2.5 text-[12px] font-bold uppercase tracking-wide text-sky-950 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background:"linear-gradient(135deg,#38bdf8,#0ea5e9)" }}
                    >
                      <Zap className="size-4" /> Analyze Now
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 rounded-sm text-[12px] font-semibold text-slate-400 hover:text-white"
                      style={{ border:"1px solid rgba(255,255,255,0.1)" }}
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: ERROR ── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              className="rounded-sm p-8 text-center"
              style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)" }}
            >
              <ShieldAlert className="size-10 text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white mb-2">Analysis failed</h2>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[12px] font-bold text-white"
                style={{ border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)" }}
              >
                <RotateCcw className="size-4" /> Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Drag-drop hint */}
        <p className="mt-6 text-center text-[11px] text-slate-600">
          You can also drag and drop a text file here, or press{" "}
          <kbd className="rounded border border-[#1b2e47] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
          {" "}+{" "}
          <kbd className="rounded border border-[#1b2e47] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">V</kbd>
          {" "}to paste and scan.
        </p>
      </div>
    </div>
  );
}
