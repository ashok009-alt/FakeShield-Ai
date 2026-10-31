"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { analyzeUrl } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { urlSamples } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResultPanel } from "@/components/result-panel";
import { ResultSkeleton } from "@/components/result-skeleton";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { UrlDetailsPanel } from "@/components/url-details";
import { cn } from "@/lib/utils";

const QUICK_SAMPLE_IDS = ["paypal", "sbi-kyc", "hdfc-subdomain", "shortener", "apk"];

export function LinkCheckerClient() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
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

  function loadSample(id: string) {
    const sample = urlSamples.find((item) => item.id === id);
    if (!sample) return;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      busyRef.current = false;
      setLoading(false);
    }
    setUrl(sample.url);
    setActiveSample(id);
    setResult(null);
    setError(null);
  }

  function randomSample() {
    const pool = urlSamples.filter((sample) => sample.id !== activeSample);
    const sample = pool[Math.floor(Math.random() * pool.length)];
    if (sample) loadSample(sample.id);
  }

  async function run() {
    const trimmed = url.trim();
    if (trimmed.length < 4) {
      setError("Enter a link to check, for example https://example.com/login.");
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
      const data = await analyzeUrl(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      if (data.id) {
        toast.success("Link check saved to history");
      } else {
        toast.warning("Checked, but not saved", {
          description: "The history database could not be reached.",
        });
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Link check failed.";
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

  return (
    <div className="space-y-6">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <label htmlFor="url-input" className="text-sm font-semibold text-foreground">
            Link to check
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste the full URL. It is parsed on the server and never opened in your browser.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
              <Input
                id="url-input"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void run();
                  }
                }}
                placeholder="https://sbi-kyc-verify.xyz/login"
                className="h-12 pl-10 text-[13.5px]"
                autoComplete="off"
                spellCheck={false}
                inputMode="url"
                aria-invalid={Boolean(error)}
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 shrink-0 sm:w-40">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  <ScanLine className="size-4" />
                  Check link
                </>
              )}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={randomSample} type="button">
            <Sparkles className="size-3.5" />
            Try a sample
          </Button>
          <span className="text-[11px] text-stone-500">or pick one:</span>
          {QUICK_SAMPLE_IDS.map((id) => {
            const sample = urlSamples.find((item) => item.id === id);
            if (!sample) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => loadSample(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  activeSample === id
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                    : "border-border bg-white/[0.02] text-stone-400 hover:border-stone-600 hover:text-stone-200"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    sample.expected === "safe" ? "bg-emerald-400" : "bg-red-400"
                  )}
                />
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ResultSkeleton />
          <div className="surface space-y-4 rounded-2xl p-6">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      ) : result && result.url ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ResultPanel
            result={result}
            onReset={() => {
              setResult(null);
              setUrl("");
              setActiveSample(null);
            }}
          />
          <div className="space-y-4 lg:sticky lg:top-32">
            <UrlDetailsPanel result={result} />
          </div>
        </div>
      ) : (
        <AnalyzerEmptyState
          icon={ShieldCheck}
          title="A structural check before you click"
          description="FakeShield inspects the URL itself: host, subdomains, lookalike brands, file types and redirects. It never loads the page or renders it in an iframe."
          steps={[
            "Paste the complete link, including any query parameters.",
            "Read the domain breakdown — the real domain is just before the first slash.",
            "With a Safe Browsing key configured, results also show a threat-feed check.",
          ]}
        />
      )}
    </div>
  );
}
