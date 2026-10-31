"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquareQuote, Search, ShieldQuestion, Target } from "lucide-react";
import { scamPatterns, patternCategories, type ScamPatternData } from "@/lib/data/patterns";
import { DataIcon } from "@/components/icon-map";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const RISK_LEVELS = ["all", "Medium", "High", "Critical"] as const;

export function PatternLibrary() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState<string>("all");
  const [active, setActive] = useState<ScamPatternData | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scamPatterns.filter((pattern) => {
      if (category !== "all" && pattern.category !== category) return false;
      if (risk !== "all" && pattern.riskLevel !== risk) return false;
      if (!q) return true;
      const haystack = [
        pattern.name,
        pattern.summary,
        pattern.category,
        pattern.goal,
        ...pattern.warningSigns,
        ...pattern.protection,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category, risk]);

  function analyzeExample(pattern: ScamPatternData) {
    router.push(`/analyze?text=${encodeURIComponent(pattern.exampleMessage)}`);
  }

  return (
    <div>
      <div className="surface flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patterns, e.g. OTP, delivery, investment…"
            className="h-11 pl-10"
            aria-label="Search scam patterns"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-full sm:w-44" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {patternCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="h-11 w-full sm:w-36" aria-label="Filter by risk level">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level === "all" ? "All risk levels" : `${level} risk`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          {filtered.length} {filtered.length === 1 ? "pattern" : "patterns"}
          {query ? ` matching “${query}”` : ""}
        </p>
        {query || category !== "all" || risk !== "all" ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setRisk("all");
            }}
            className="text-xs text-orange-300 underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="surface mt-4 rounded-2xl px-6 py-14 text-center">
          <ShieldQuestion className="mx-auto size-8 text-stone-500" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">No patterns match that search</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-stone-400">
            Try a broader term such as “bank”, “job” or “crypto”, or clear the filters to see the full
            library.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pattern) => (
            <button
              key={pattern.id}
              type="button"
              onClick={() => setActive(pattern)}
              className={cn(
                "surface group flex h-full flex-col rounded-2xl p-5 text-left transition-colors",
                "hover:border-orange-500/35 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07] text-orange-300">
                  <DataIcon name={pattern.icon} className="size-5" />
                </span>
                <RiskBadge level={pattern.riskLevel} />
              </div>
              <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
                {pattern.name}
              </h2>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-stone-500">
                {pattern.category}
              </p>
              <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-6 text-stone-400">
                {pattern.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-300">
                Read the breakdown
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-lg border border-orange-500/20 bg-orange-500/[0.07] text-orange-300">
                    <DataIcon name={active.icon} className="size-4.5" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {active.category}
                  </span>
                  <RiskBadge level={active.riskLevel} />
                </div>
                <DialogTitle className="mt-2 text-xl">{active.name}</DialogTitle>
                <DialogDescription>{active.summary}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 sm:grid-cols-2">
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    <ShieldQuestion className="size-3.5" />
                    Common warning signs
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {active.warningSigns.map((sign) => (
                      <li key={sign} className="flex gap-2 text-[13px] leading-5 text-stone-300">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-400/80" />
                        {sign}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    <Target className="size-3.5" />
                    What scammers want
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-stone-300">{active.goal}</p>

                  <h3 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    How to protect yourself
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {active.protection.map((tip) => (
                      <li key={tip} className="flex gap-2 text-[13px] leading-5 text-stone-300">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400/80" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <MessageSquareQuote className="size-3.5" />
                  Example suspicious message
                </h3>
                <blockquote className="mt-2 rounded-xl border border-border/70 bg-black/25 p-4 font-mono text-[12.5px] leading-6 text-stone-300">
                  {active.exampleMessage}
                </blockquote>
              </section>

              <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-stone-500">
                  Signals used by the analyzer:{" "}
                  <span className="font-mono text-[10px] text-stone-400">
                    {active.relatedSignals.join(", ")}
                  </span>
                </p>
                <Button onClick={() => analyzeExample(active)} className="shrink-0">
                  Analyze this example
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
