"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanText, Sparkles, Wand2 } from "lucide-react";
import { analyzeMessage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { getMessageSample, messageSamples } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResultPanel } from "@/components/result-panel";
import { ResultSkeleton } from "@/components/result-skeleton";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { BeforeAfterPanel } from "@/components/before-after-panel";
import { VoiceInput } from "@/components/voice-input";
import { HudCorners } from "@/components/hud-corners";
import { cn } from "@/lib/utils";

const QUICK_SAMPLE_IDS = ["kyc-block", "delivery-fee", "tax-refund", "safe-delivery"];

export function AnalyzeClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const autoRan = useRef(false);

  const focusInput = useCallback(() => {
    // Never yank the mobile viewport (or pop the keyboard) on focus.
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, []);

  function cancelActive() {
    if (!abortRef.current) return;
    abortRef.current.abort();
    abortRef.current = null;
    busyRef.current = false;
    setLoading(false);
  }

  const run = useCallback(
    async (input: string) => {
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
      setAnalyzedText("");

      try {
        const data = await analyzeMessage(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResult(data);
        setAnalyzedText(trimmed);
        if (data.id) {
          toast.success("Analysis saved to history", {
            description: "You can review or delete it from the History page.",
          });
        } else {
          toast.warning("Analysed, but not saved", {
            description: "The history database could not be reached.",
          });
        }
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth";
        window.setTimeout(() => {
          if (!controller.signal.aborted) {
            resultRef.current?.scrollIntoView({ behavior, block: "start" });
          }
        }, 80);
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
    },
    []
  );

  // Abort any in-flight analysis when leaving the page.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      busyRef.current = false;
    },
    []
  );

  useEffect(() => {
    if (autoRan.current) return;
    // Read deep-link params after mount so this component never needs a
    // Suspense boundary (which could defer hydration of the whole form).
    const params = new URLSearchParams(window.location.search);
    const sampleId = params.get("sample");
    if (sampleId) {
      const sample = getMessageSample(sampleId);
      if (!sample) return;
      autoRan.current = true;
      setText(sample.text);
      setActiveSample(sample.id);
      void run(sample.text);
      return;
    }

    const custom = params.get("text");
    if (custom && custom.trim().length >= 10) {
      autoRan.current = true;
      const trimmed = custom.trim().slice(0, 10000);
      setText(trimmed);
      void run(trimmed);
    }
  }, [run]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  function applySample(id: string) {
    const sample = getMessageSample(id);
    if (!sample) return;
    cancelActive();
    setText(sample.text);
    setActiveSample(id);
    setResult(null);
    setAnalyzedText("");
    setError(null);
    focusInput();
  }

  function randomSample() {
    const pool = messageSamples.filter((sample) => sample.id !== activeSample);
    const sample = pool[Math.floor(Math.random() * pool.length)];
    if (sample) applySample(sample.id);
  }

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:sticky lg:top-32" style={{ border: "1px solid rgba(251,146,60,0.1)", background: "linear-gradient(145deg, rgba(28,20,12,0.97) 0%, rgba(15,9,6,0.99) 100%)", boxShadow: "0 0 60px -20px rgba(251,146,60,0.08), 0 24px 80px -40px rgba(0,0,0,0.95)" }}>
        <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true" />
        <HudCorners />
        <div className="relative flex items-center justify-between gap-3">
          <Label htmlFor="message-input" className="flex items-center gap-2 text-sm font-bold text-white">
            <ScanText className="size-4 text-orange-400" />
            Suspicious message
          </Label>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              text.length > 10000 ? "text-red-300" : "text-stone-500"
            )}
          >
            {text.length.toLocaleString()} / 10,000
          </span>
        </div>

        <Textarea
          id="message-input"
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
          placeholder="Paste an SMS, WhatsApp message, email text, or any message that feels off…"
          className="mt-3 min-h-[240px] resize-y text-[13.5px] leading-6"
          maxLength={10000}
          spellCheck={false}
          aria-describedby="message-hint"
        />

        {error ? (
          <p role="alert" className="mt-2 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={randomSample} type="button">
            <Sparkles className="size-3.5" />
            Try a sample
          </Button>
          <span className="text-[11px] text-stone-500">or pick one:</span>
        </div>

        <div className="mt-3">
          <VoiceInput
            onAppend={(spoken) => {
              setText((current) => {
                const base = current.trimEnd();
                const next = base ? `${base} ${spoken}` : spoken;
                return next.slice(0, 10000);
              });
              if (error) setError(null);
            }}
          />
          <p className="mt-1 text-[10px] leading-5 text-stone-600">
            Dictation uses your browser&apos;s speech recognition. Audio is not sent to FakeShield.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_SAMPLE_IDS.map((id) => {
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
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                    : "border-white/[0.08] bg-white/[0.02] text-stone-400 hover:border-white/[0.18] hover:text-stone-200"
                )}
              >
                {sample.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p id="message-hint" className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <kbd className="rounded border border-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border border-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
            to analyse
          </p>
          <Button onClick={() => void run(text)} disabled={loading} type="button">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <ScanText className="size-4" />
                Analyze now
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-5 text-stone-500">
          <Wand2 className="mt-0.5 size-3 shrink-0" />
          Analysis runs on this server. The text is stored in your anonymous local history and can
          be deleted at any time.
        </p>
      </div>

      <div ref={resultRef} className="scroll-mt-32">
        {loading ? (
          <ResultSkeleton />
        ) : result ? (
          <ResultPanel
            result={result}
            inputLength={analyzedText.length}
            onReset={() => {
              setResult(null);
              setText("");
              setAnalyzedText("");
              setActiveSample(null);
              focusInput();
            }}
          />
        ) : (
          <AnalyzerEmptyState
            icon={ScanText}
            title="Your breakdown will appear here"
            description="FakeShield reads the message, extracts links and contact details, and explains which scam patterns it resembles."
            steps={[
              "Paste the full message — include the sender name if you have it.",
              "Press Analyze now, or Ctrl/Cmd + Enter.",
              "Read the warning signs and next steps before replying to anyone.",
            ]}
          />
        )}
      </div>
      </div>

      {!loading && result && analyzedText ? (
        <BeforeAfterPanel text={analyzedText} result={result} />
      ) : null}
    </div>
  );
}
