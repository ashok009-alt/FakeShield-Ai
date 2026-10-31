"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Signal,
  Sparkles,
} from "lucide-react";
import { fetchCommunity } from "@/lib/api-client";
import type { CommunityItem, CommunityResponse } from "@/lib/community";
import { INPUT_TYPE_LABEL, RISK_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  message: MessageSquare,
  email: Mail,
  url: Globe,
} as const;

export function CommunityFeed() {
  const [data, setData] = useState<CommunityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const next = await fetchCommunity(controller.signal);
      if (controller.signal.aborted) return;
      setData(next);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "The feed could not be loaded.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load("initial");
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load("refresh");
    }, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const items = data?.items ?? [];
  const urgent = items.filter((item) => item.riskLevel === "Critical" || item.riskLevel === "High").length;
  const topType = mostCommonType(items);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
      <div className="space-y-4">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">Live community feed</h2>
              <Badge variant="outline">Last 20 checks</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void load("refresh")}
              disabled={refreshing || loading}
            >
              <RefreshCw className={cn("size-3.5", refreshing ? "animate-spin" : "")} />
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Checks in feed" value={items.length.toString()} />
            <MiniStat label="High or critical" value={urgent.toString()} accent />
            <MiniStat label="Most common" value={topType} />
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
              <p className="text-[12px] text-red-200">{error}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => void load("initial")}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-white/[0.02] px-4 py-8 text-center">
              <Sparkles className="mx-auto size-5 text-stone-500" />
              <p className="mt-2 text-[12px] text-stone-400">No checks in the feed yet.</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/message">Run the first check</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-border bg-black/20">
              {items.map((item, index) => (
                <FeedRow key={`${item.createdAt}-${index}`} item={item} index={index} />
              ))}
            </ul>
          )}

          <p className="mt-3 text-[10px] leading-5 text-stone-600">
            {data?.note ??
              "Derived fields only. Message text, links, phone numbers and personal details are never exposed."}
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-emerald-300" />
            <h2 className="text-sm font-semibold text-foreground">What is public</h2>
          </div>
          <ul className="mt-3 space-y-2 text-[11px] leading-5 text-stone-400">
            {[
              "Input type (message, email, link)",
              "Risk level and 0–100 score",
              "The first warning sign label",
              "When the check ran",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400/70" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2">
            <p className="text-[10px] leading-4 text-red-200/80">
              Never public: message text, email addresses, phone numbers, links, extracted entities
              or your session ID.
            </p>
          </div>
        </div>

        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Signal className="size-4 text-orange-300" />
            <h2 className="text-sm font-semibold text-foreground">Read the feed carefully</h2>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">
            A row describes one person&apos;s submitted text, not a verified crime. Many low-risk rows
            are legitimate messages that were checked out of caution. The seeded demo rows are
            synthetic.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
            <Link href="/history">
              See your own history
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
          <ShieldCheck className="size-4 text-orange-300" />
          <h2 className="mt-2 text-[12.5px] font-semibold text-orange-200">Add a check</h2>
          <p className="mt-1 text-[10.5px] leading-5 text-stone-400">
            Every analysis you run appears here anonymously — and helps the demo feel live.
          </p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href="/">Analyze a message</Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

function FeedRow({ item, index }: { item: CommunityItem; index: number }) {
  const Icon = TYPE_ICON[item.inputType];
  const meta = RISK_META[item.riskLevel];
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <span className="mono w-6 shrink-0 text-[9px] tabular-nums text-stone-600">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-white/[0.02]">
        <Icon className="size-3.5 text-stone-400" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-stone-200">
            {INPUT_TYPE_LABEL[item.inputType]}
          </span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", meta.bg, meta.text)}>
            {item.riskLevel}
          </span>
        </div>
        <p className="truncate text-[10.5px] text-stone-500">{item.topSignal}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-[13px] font-semibold tabular-nums", meta.text)}>{item.riskScore}</p>
        <p className="text-[9px] text-stone-600">{relativeTime(item.createdAt)}</p>
      </div>
    </li>
  );
}

function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-white/[0.02] px-2.5 py-2">
      <p className={cn("truncate text-sm font-semibold tabular-nums", accent ? "text-orange-300" : "text-stone-200")}>
        {value}
      </p>
      <p className="truncate text-[9px] uppercase tracking-[0.1em] text-stone-600">{label}</p>
    </div>
  );
}

function mostCommonType(items: CommunityItem[]): string {
  if (items.length === 0) return "—";
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.inputType, (counts.get(item.inputType) ?? 0) + 1);
  const [type] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return INPUT_TYPE_LABEL[type as CommunityItem["inputType"]] ?? "—";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
