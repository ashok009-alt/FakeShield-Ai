"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Info,
  RotateCcw,
  ScanLine,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { INPUT_TYPE_LABEL, RISK_META } from "@/lib/constants";
import { buildShareSummary, reportFilename, reportPath } from "@/lib/report";
import { copyText, downloadJson } from "@/lib/utils";
import { ScoreRing } from "@/components/score-ring";
import { ScoreExplainDialog } from "@/components/score-explain-dialog";
import { RiskBadge } from "@/components/risk-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignalList } from "@/components/signal-list";
import { ExtractedPanel } from "@/components/extracted-panel";
import { HudCorners } from "@/components/hud-corners";
import { ShareCardDialog } from "@/components/share-card-dialog";
import { AuthorityReportDialog } from "@/components/authority-report-dialog";
import { AiReviewPanel } from "@/components/ai-review-panel";
import { SafetyNotices } from "@/components/safety-notices";
import { BreachPanel } from "@/components/breach-panel";
import { ReportPdfButton } from "@/components/report-pdf-button";
import { useAssistantStore } from "@/lib/assistant-store";

export function ResultPanel({
  result,
  onReset,
  compact = false,
  showReportLink = true,
  inputLength,
}: {
  result: AnalysisResult;
  onReset?: () => void;
  compact?: boolean;
  showReportLink?: boolean;
  inputLength?: number;
}) {
  const meta = RISK_META[result.riskLevel];
  const reportHref = reportPath(result);
  const confidencePercent = Math.round(result.confidence * 100);
  const llmActive = result.llm?.status === "ok" || result.llm?.status === "cached";
  const setContext = useAssistantStore((state) => state.setContext);

  useEffect(() => {
    setContext(result);
  }, [result, setContext]);

  // Let the fixed backdrop answer the verdict: a subtle warm glow for
  // High/Critical results, a cooler field for Low. Removed when the panel
  // unmounts so the next page starts neutral.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.threat = result.riskLevel.toLowerCase();
    return () => {
      if (root.dataset.threat === result.riskLevel.toLowerCase()) delete root.dataset.threat;
    };
  }, [result.riskLevel]);

  async function handleCopy() {
    const ok = await copyText(buildShareSummary(result));
    if (ok) toast.success("Summary copied", { description: "Paste it wherever you need." });
    else toast.error("Could not copy. Select the text manually.");
  }

  async function handleShare() {
    if (!reportHref) {
      toast.error("This result wasn't saved, so there is no report link to share.");
      return;
    }
    const url = `${window.location.origin}${reportHref}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FakeShield AI analysis",
          text: `${result.riskLevel} risk · ${result.riskScore}/100 — ${result.summary}`,
          url,
        });
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        // Fall back to a clipboard copy below.
      }
    }
    const ok = await copyText(url);
    if (ok) {
      toast.success("Report link copied", {
        description:
          "Reports live in this browser's anonymous session — open the link on this device.",
      });
    } else {
      toast.error("Could not copy the report link.");
    }
  }

  function handleDownload() {
    downloadJson(reportFilename(result), result);
    toast.success("Report downloaded", { description: "Saved as JSON." });
  }

  return (
    <motion.section
      aria-live="polite"
      aria-label="Analysis result"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(251,146,60,0.12)", background: "linear-gradient(145deg, rgba(28,20,12,0.97) 0%, rgba(15,9,6,0.99) 100%)", boxShadow: "0 0 60px -20px rgba(251,146,60,0.12), 0 24px 80px -40px rgba(0,0,0,0.95)" }}>
        <div className="texture-noise pointer-events-none absolute inset-0 z-0 opacity-[0.04]" aria-hidden="true" />
        <HudCorners className="z-10" />
        <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-5 py-3.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <ShieldCheck className="size-4 text-orange-400" />
            Analysis result
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {llmActive ? (
              <Badge
                variant="success"
                title="Rule engine evidence blended with a Gemini semantic review"
              >
                <Sparkles className="size-3" />
                Hybrid · Gemini
              </Badge>
            ) : result.threatFeed === "verified" ? (
              <Badge variant="success" title="Checked against Google Safe Browsing">
                <ShieldCheck className="size-3" />
                Threat-feed verified
              </Badge>
            ) : (
              <Badge variant="warning" title="Based on the deterministic rule engine only">
                <ScanLine className="size-3" />
                Rule engine
              </Badge>
            )}
            <Badge variant="neutral">{INPUT_TYPE_LABEL[result.inputType]}</Badge>
            {result.id ? (
              <Badge variant="neutral" title="This analysis is saved in your history">
                <CheckCircle2 className="size-3" />
                Saved
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="grid items-start gap-6 sm:grid-cols-[auto_1fr]">
            <ScoreExplainDialog result={result} inputLength={inputLength}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Explain how the ${result.riskScore} out of 100 ${result.riskLevel} score was calculated`}
                className="group flex flex-col items-center gap-1.5 rounded-2xl p-1 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
              >
                <ScoreRing
                  score={result.riskScore}
                  level={result.riskLevel}
                  size={compact ? 128 : 148}
                />
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500 transition-colors group-hover:text-orange-300">
                  <Info className="size-3" />
                  How is this scored?
                </span>
              </button>
            </ScoreExplainDialog>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level={result.riskLevel} />
                <span className="text-xs text-muted-foreground">{meta.description}</span>
              </div>

              <p className="mt-3 text-[15px] leading-7 text-stone-200 sm:text-base">
                {result.summary}
              </p>

              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-semibold tabular-nums text-stone-200">
                    {confidencePercent}%
                  </span>
                </div>
                <Progress
                  value={confidencePercent}
                  className="mt-1.5"
                  indicatorClassName={meta.bar}
                  label="Confidence estimate"
                />
                <p className="mt-1 text-[11px] leading-5 text-stone-500">
                  {llmActive
                    ? "Blended from rule-engine evidence and Gemini's semantic confidence."
                    : "How strongly the detected signals support this rating."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={handleCopy}>
                  <Copy className="size-3.5" />
                  Copy summary
                </Button>
                {reportHref ? (
                  <Button size="sm" variant="ghost" onClick={() => void handleShare()}>
                    <Share2 className="size-3.5" />
                    Share
                  </Button>
                ) : null}
                <ShareCardDialog result={result} />
                {result.riskScore >= 50 ? <AuthorityReportDialog result={result} /> : null}
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  <Download className="size-3.5" />
                  Download JSON
                </Button>
                <ReportPdfButton result={result} />
                {reportHref && showReportLink ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={reportHref}>
                      Open saved report
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : null}
                {onReset ? (
                  <Button size="sm" variant="ghost" onClick={onReset}>
                    <RotateCcw className="size-3.5" />
                    New analysis
                  </Button>
                ) : null}
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-5 text-stone-500">
                <Info className="mt-0.5 size-3 shrink-0" />
                FakeShield AI provides risk guidance, not a final security verdict.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SafetyNotices otp={result.otp} officialDomain={result.officialDomain} />

      {!compact ? <AiReviewPanel llm={result.llm} /> : null}

      {!compact ? <BreachPanel breach={result.breach} /> : null}

      {result.signals.length > 0 ? (
        <div className="rounded-2xl p-5 sm:p-6" style={{ border: "1px solid rgba(50,36,24,0.9)", background: "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Warning signs detected</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-300">
              {result.signals.length} found
            </span>
          </div>
          <SignalList
            signals={result.signals}
            initialLimit={compact ? 2 : 4}
            showRecommendations={!compact}
          />
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl p-5 sm:p-6" style={{ border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.04)" }}>
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">No strong warning signs found</h3>
            <p className="mt-1 text-[13px] leading-6 text-stone-400">
              That is not a guarantee. New scams can avoid known patterns, and some legitimate
              messages look suspicious. Still verify any request for money, passwords or personal
              details through the organisation&apos;s official app or website.
            </p>
          </div>
        </div>
      )}

      {!compact && result.recommendations.length > 0 ? (
        <div className="rounded-2xl p-5 sm:p-6" style={{ border: "1px solid rgba(251,146,60,0.12)", background: "rgba(251,146,60,0.04)" }}>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="grid size-5 place-items-center rounded-full bg-orange-500/15 border border-orange-500/25">
              <span className="size-1.5 rounded-full bg-orange-400" />
            </span>
            What you should do
          </h3>
          <ol className="mt-4 space-y-3">
            {result.recommendations.map((recommendation, index) => (
              <li key={recommendation} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-orange-500/25 bg-orange-500/10 text-[11px] font-bold text-orange-300">
                  {index + 1}
                </span>
                <p className="text-[13px] leading-6 text-stone-300">{recommendation}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {!compact ? (
        <>
          <div className="rounded-2xl p-5 sm:p-6" style={{ border: "1px solid rgba(50,36,24,0.9)", background: "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)" }}>
            <h3 className="mb-4 text-sm font-bold text-white">Extracted details</h3>
            <ExtractedPanel extracted={result.extracted} />
            {Object.values(result.extracted).every((value) => value.length === 0) ? (
              <p className="text-[13px] text-stone-500">
                No links, phone numbers, payment terms or amounts were found in this input.
              </p>
            ) : null}
          </div>

          <p className="px-1 text-[11px] text-stone-600">
            Inputs are stored locally so you can review them later. Delete them from History at
            any time.
          </p>
        </>
      ) : null}
    </motion.section>
  );
}
