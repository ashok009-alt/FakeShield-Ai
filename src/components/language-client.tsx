"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Languages,
  Loader2,
  ScanLine,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { analyzeLanguage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { detectLanguage } from "@/lib/language";
import { languageSamples } from "@/lib/data/language-samples";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ResultPanel } from "@/components/result-panel";
import { ResultSkeleton } from "@/components/result-skeleton";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { cn } from "@/lib/utils";

const MAX_CHARS = 4000;

export function LanguageAnalyzerClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const detection = useMemo(() => detectLanguage(text), [text]);
  const overLimit = text.length > MAX_CHARS;

  function loadSample(id: string) {
    const sample = languageSamples.find((item) => item.id === id);
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
      setError("Paste a message of at least a few words to analyse.");
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
      const data = await analyzeLanguage(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      if (data.id) toast.success("Analysis saved to history");
      else toast.warning("Analysed, but not saved", { description: "The history database could not be reached." });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Language analysis failed.";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <label htmlFor="language-input" className="text-sm font-semibold text-foreground">
                Paste the message in any supported language
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Hindi, Bengali, Tamil and Telugu have phrase dictionaries. Other Indian scripts are
                detected and flagged, but not fully glossed.
              </p>
            </div>
            <Badge variant="outline">
              <Languages className="size-3" />
              {detection.code === "en" ? "Waiting for text" : `Detected: ${detection.label}`}
            </Badge>
          </div>

          <Textarea
            id="language-input"
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
            rows={8}
            maxLength={MAX_CHARS + 200}
            className="mt-3 min-h-[180px] resize-y text-[14px] leading-7"
            placeholder="प्रिय ग्राहक, आपका खाता बंद हो जाएगा… / பில் நிலுவையில் உள்ளது…"
            aria-invalid={Boolean(error) || overLimit}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-[11px]", overLimit ? "text-red-300" : "text-stone-500")}>
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              {overLimit ? " — trim it before analysing" : ""}
            </p>
            <Button type="button" onClick={() => void run()} disabled={loading || overLimit} className="h-11 min-w-48">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Translating & analysing…
                </>
              ) : (
                <>
                  <Languages className="size-4" />
                  Translate &amp; analyse
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
            <Button size="sm" variant="secondary" type="button" onClick={() => loadSample(languageSamples[0].id)}>
              <Sparkles className="size-3.5" />
              Try a sample
            </Button>
            <span className="text-[11px] text-stone-500">or pick one:</span>
            {languageSamples.map((sample) => (
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
                <span>{sample.native}</span>
                <span className="text-[10px] text-stone-500">{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">How the translation works</h3>
          <ol className="mt-4 space-y-3.5">
            <PipelineStep n={1} title="Detect the script" active={text.trim().length > 0}>
              Counts characters per script to identify the language. Hinglish is detected from
              common Romanised markers.
            </PipelineStep>
            <PipelineStep n={2} title="Gloss scam phrases" active={Boolean(result?.language)} done={Boolean(result?.language)}>
              A labelled phrase table replaces known scam terms with English equivalents — not a
              full translation model.
            </PipelineStep>
            <PipelineStep n={3} title="Run the same engine" active={Boolean(result)} done={Boolean(result)}>
              The English gloss goes through the identical signal engine, so scores are comparable
              across languages.
            </PipelineStep>
          </ol>

          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3.5 py-3">
            <p className="flex items-start gap-2 text-[11px] leading-5 text-amber-200/80">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              Phrase-level translation can miss sarcasm, dialect and context. Use the score as a
              prompt to verify — not as a verdict.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {["हिन्दी", "বাংলা", "தமிழ்", "తెలుగు"].map((script) => (
              <div
                key={script}
                className="rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-center text-[13px] text-stone-400"
              >
                {script}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-stone-600">
            Full phrase tables · other scripts flagged as unrecognised
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ResultSkeleton />
          <div className="surface space-y-4 rounded-2xl p-6">
            <div className="skeleton h-28 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      ) : result ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ResultPanel result={result} onReset={reset} inputLength={text.trim().length} />
          <div className="space-y-4 lg:sticky lg:top-32">
            {result.language ? <TranslationPanel result={result} original={text.trim()} /> : null}
            {result.language?.partial ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                <p className="flex items-start gap-2 text-[11px] leading-5 text-amber-200/80">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  Coverage is partial. Ask a fluent speaker to confirm the message before you act on
                  a low score.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <AnalyzerEmptyState
          icon={Languages}
          title="The same detector, across scripts"
          description="Scammers write in the language their target trusts. FakeShield detects the script, glosses known scam phrases into English, then runs the identical scoring engine."
          steps={[
            "Paste the message as received — do not retype it.",
            "Check the detected language and the phrase coverage.",
            "Compare the English gloss with the original before you trust the result.",
          ]}
        />
      )}
    </div>
  );
}

function TranslationPanel({ result, original }: { result: AnalysisResult; original: string }) {
  const language = result.language;
  if (!language) return null;
  const coverage = Math.round(language.coverage * 100);

  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Translation used</h3>
        <Badge variant={language.partial ? "warning" : "success"}>
          {language.partial ? (
            <TriangleAlert className="size-3" />
          ) : (
            <CheckCircle2 className="size-3" />
          )}
          {language.label} · {language.script}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">Original</p>
          <p className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-black/25 px-3 py-2.5 text-[12px] leading-6 text-stone-300">
            {original}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            English gloss
          </p>
          <p className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-orange-500/20 bg-orange-500/[0.04] px-3 py-2.5 text-[12px] leading-6 text-stone-300">
            {language.translated}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-500">Phrase coverage</span>
          <span className="tabular-nums text-stone-300">{coverage}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full", coverage >= 45 ? "bg-emerald-400/80" : "bg-amber-400/80")}
            style={{ width: `${Math.max(3, coverage)}%` }}
          />
        </div>
      </div>

      {language.matchedTerms.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {language.matchedTerms.map((term) => (
            <span
              key={term}
              className="rounded-full border border-border bg-white/[0.02] px-2 py-0.5 text-[10px] text-stone-400"
            >
              {term}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-5 text-stone-500">
          No glossary phrases matched, so the engine relied on the general language signal only.
        </p>
      )}

      <p className="mt-4 border-t border-border/60 pt-3 text-[10.5px] leading-5 text-stone-500">
        Gloss is produced locally from a phrase dictionary. It is shown so you can audit what the
        engine actually read.
      </p>
    </div>
  );
}

function PipelineStep({
  n,
  title,
  children,
  active,
  done = false,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  active: boolean;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
          done
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : active
              ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
              : "border-border bg-white/[0.02] text-stone-600"
        )}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : n}
      </span>
      <div>
        <p className={cn("text-[12px] font-medium", active ? "text-stone-200" : "text-stone-500")}>{title}</p>
        <p className="mt-0.5 text-[10.5px] leading-5 text-stone-500">{children}</p>
      </div>
    </li>
  );
}
