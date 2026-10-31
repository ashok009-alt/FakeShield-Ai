"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Phone,
  RotateCcw,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { analyzeMessage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { reportPath } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Verdict = "yes" | "maybe" | "no";

export function SimpleCheckClient({ name }: { name: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  // A gentle verdict tint for the shared family page — the same adaptive
  // signal the full result panel uses, at a lower intensity.
  useEffect(() => {
    const root = document.documentElement;
    if (!result) {
      delete root.dataset.threat;
      return;
    }
    root.dataset.threat = result.riskLevel.toLowerCase();
    return () => {
      if (root.dataset.threat === result.riskLevel.toLowerCase()) delete root.dataset.threat;
    };
  }, [result]);

  async function run() {
    const trimmed = text.trim();
    if (trimmed.length < 12) {
      setError("Paste the full message so it can be checked.");
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
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "The check failed.";
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
    setResult(null);
    setText("");
    setError(null);
  }

  if (result) {
    const verdict: Verdict = result.riskScore >= 50 ? "yes" : result.riskScore >= 25 ? "maybe" : "no";
    return <VerdictCard verdict={verdict} result={result} onReset={reset} />;
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="surface rounded-3xl p-6 sm:p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300/80">
          A safety check from {name}
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Got a suspicious message?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-[13px] leading-6 text-stone-400">
          Paste it below. You will get one plain answer: is it a scam, maybe, or no strong signs.
        </p>

        <Textarea
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
          rows={6}
          maxLength={4000}
          className="mt-5 min-h-[140px] text-[15px] leading-7"
          placeholder="Paste the SMS, WhatsApp or email message here…"
          aria-label="Message to check"
          aria-invalid={Boolean(error)}
        />

        {error ? (
          <p role="alert" className="mt-2 text-center text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="mt-4 h-14 w-full text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <ScanLine className="size-5" />
              Check this message
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-[10.5px] leading-5 text-stone-500">
          The message is checked by FakeShield and saved only in this browser&apos;s anonymous
          session. Never share OTPs or bank details with anyone.
        </p>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <SmallTip icon={<ShieldAlert className="size-3.5 text-red-300" />} text="Do not click links in unexpected messages." />
        <SmallTip icon={<Phone className="size-3.5 text-orange-300" />} text="Call the person on a number you already know." />
        <SmallTip icon={<CheckCircle2 className="size-3.5 text-emerald-300" />} text="No OTP, PIN or password is ever needed to “verify” you." />
      </div>
    </div>
  );
}

function VerdictCard({
  verdict,
  result,
  onReset,
}: {
  verdict: Verdict;
  result: AnalysisResult;
  onReset: () => void;
}) {
  const meta =
    verdict === "yes"
      ? {
          word: "YES",
          question: "This looks like a scam.",
          detail: "Do not reply, pay, click or share any code. Show this screen to someone you trust.",
          icon: ShieldAlert,
          panel: "border-red-500/40 bg-red-500/[0.12]",
          text: "text-red-300",
          glow: "shadow-[0_0_80px_-20px_rgba(239,68,68,0.5)]",
        }
      : verdict === "maybe"
        ? {
            word: "MAYBE",
            question: "Some warning signs were found.",
            detail: "Do not act yet. Ask the person using a number you already know, or check the official app.",
            icon: HelpCircle,
            panel: "border-amber-500/40 bg-amber-500/[0.10]",
            text: "text-amber-300",
            glow: "shadow-[0_0_80px_-20px_rgba(245,158,11,0.4)]",
          }
        : {
            word: "NO",
            question: "No strong scam signs found.",
            detail: "That is not a guarantee. Still never share an OTP, PIN or password.",
            icon: CheckCircle2,
            panel: "border-emerald-500/35 bg-emerald-500/[0.08]",
            text: "text-emerald-300",
            glow: "shadow-[0_0_80px_-20px_rgba(16,185,129,0.35)]",
          };
  const Icon = meta.icon;
  const href = reportPath(result);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className={cn("surface overflow-hidden rounded-3xl border-2", meta.panel, meta.glow)}>
        <div className="px-6 py-9 text-center sm:px-8 sm:py-12">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            Is this a scam?
          </p>
          <Icon className={cn("mx-auto mt-5 size-14", meta.text)} />
          <p className={cn("mt-2 text-[76px] font-black leading-none tracking-tighter sm:text-[104px]", meta.text)}>
            {meta.word}
          </p>
          <p className="mt-4 text-xl font-semibold text-white">{meta.question}</p>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-6 text-stone-300">{meta.detail}</p>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-6 py-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500">FakeShield risk score</span>
            <span className="font-semibold tabular-nums text-stone-200">{result.riskScore}/100</span>
          </div>
          <p className="mt-2 text-[10.5px] leading-5 text-stone-500">
            {result.summary}
          </p>
        </div>
      </div>

      {verdict !== "no" ? (
        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-5">
          <h2 className="text-[13px] font-semibold text-orange-200">What to do now</h2>
          <ol className="mt-3 space-y-2.5">
            {[
              "Do not reply, call back, pay or share any OTP or password.",
              "Call the person or company on a number you already have.",
              "If money was lost, call 1930 and report at cybercrime.gov.in.",
            ].map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-[12.5px] leading-5 text-stone-300">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-orange-500/25 bg-orange-500/10 text-[10px] font-bold text-orange-300">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="size-4" />
          Check another message
        </Button>
        {href ? (
          <Button variant="ghost" asChild>
            <Link href={href}>
              See the detailed reasons
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <p className="mt-5 text-center text-[10.5px] leading-5 text-stone-500">
        FakeShield AI provides risk guidance, not a final security verdict.
      </p>
    </div>
  );
}

function SmallTip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
      <span className="mt-0.5">{icon}</span>
      <p className="text-[10.5px] leading-4 text-stone-400">{text}</p>
    </div>
  );
}
