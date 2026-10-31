"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Gauge,
  Link2,
  Mail,
  MessageSquare,
  RefreshCw,
  ScanText,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { INPUT_TYPE_LABEL, RISK_META } from "@/lib/constants";
import type { StoredAnalysis } from "@/lib/serialize";
import { formatDateTime, formatRelative, truncate } from "@/lib/utils";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ScanVolumeChart = dynamic(
  () => import("@/components/history-charts").then((mod) => mod.ScanVolumeChart),
  { ssr: false, loading: () => <div className="skeleton h-56 w-full" /> }
);
const RiskMixChart = dynamic(
  () => import("@/components/history-charts").then((mod) => mod.RiskMixChart),
  { ssr: false, loading: () => <div className="skeleton h-56 w-full" /> }
);

const TYPE_ICONS = {
  message: MessageSquare,
  email: Mail,
  url: Link2,
} as const;

export function HistoryDashboard() {
  const analyses = useHistoryStore((state) => state.analyses);
  const stats = useHistoryStore((state) => state.stats);
  const level = useHistoryStore((state) => state.level);
  const type = useHistoryStore((state) => state.type);
  const loading = useHistoryStore((state) => state.loading);
  const deletingId = useHistoryStore((state) => state.deletingId);
  const error = useHistoryStore((state) => state.error);
  const hasLoaded = useHistoryStore((state) => state.hasLoaded);
  const setLevel = useHistoryStore((state) => state.setLevel);
  const setType = useHistoryStore((state) => state.setType);
  const load = useHistoryStore((state) => state.load);
  const remove = useHistoryStore((state) => state.remove);

  const [pendingDelete, setPendingDelete] = useState<StoredAnalysis | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!hasLoaded) void load();
  }, [hasLoaded, load]);

  const tokens = useMemo(
    () =>
      deferredQuery
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [deferredQuery]
  );

  const visibleAnalyses = useMemo(() => {
    if (tokens.length === 0) return analyses;
    return analyses.filter((item) => {
      const haystack = [
        item.rawInput,
        item.summary,
        item.riskLevel,
        INPUT_TYPE_LABEL[item.inputType] ?? item.inputType,
        String(item.riskScore),
        ...item.signals.map((signal) => signal.label),
        ...item.extracted.urls,
        ...item.extracted.phoneNumbers,
        ...item.extracted.emails,
        ...item.extracted.brands,
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [analyses, tokens]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete.id);
    if (ok) {
      toast.success("Analysis deleted", {
        description: "It has been removed from this browser's history.",
      });
    } else {
      toast.error("Could not delete the analysis. Try again.");
    }
    setPendingDelete(null);
  }

  const filtered = level !== "all" || type !== "all";

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ScanText}
          label="Total scans"
          value={stats ? stats.totalScans.toLocaleString() : "—"}
          hint="Saved in this browser"
        />
        <StatCard
          icon={ShieldAlert}
          label="High-risk finds"
          value={stats ? stats.highRiskCount.toLocaleString() : "—"}
          hint={stats ? `${stats.byLevel.Critical} critical` : "High + critical"}
          tone="danger"
        />
        <StatCard
          icon={Gauge}
          label="Average confidence"
          value={stats && stats.totalScans > 0 ? `${Math.round(stats.averageConfidence * 100)}%` : "—"}
          hint="Across all saved checks"
        />
        <StatCard
          icon={BarChart3}
          label="Most common signal"
          value={stats?.mostCommonSignal ? truncate(stats.mostCommonSignal.label, 26) : "—"}
          hint={
            stats?.mostCommonSignal
              ? `Seen in ${stats.mostCommonSignal.count} ${
                  stats.mostCommonSignal.count === 1 ? "analysis" : "analyses"
                }`
              : "Run a few analyses to see trends"
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Scan volume</h2>
              <p className="text-[11px] text-stone-500">Last 7 days</p>
            </div>
            {stats ? (
              <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-wider text-stone-400">
                {stats.totalScans} total
              </span>
            ) : null}
          </div>
          <div className="mt-4">
            {stats ? <ScanVolumeChart stats={stats} /> : <div className="skeleton h-56 w-full" />}
          </div>
        </div>
        <div className="surface rounded-2xl p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Risk mix</h2>
            <p className="text-[11px] text-stone-500">All saved analyses</p>
          </div>
          <div className="mt-4">
            {stats ? <RiskMixChart stats={stats} /> : <div className="skeleton h-56 w-full" />}
          </div>
        </div>
      </section>

      <section className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent analyses</h2>
            <p className="text-[11px] text-stone-500">
              {loading
                ? "Loading…"
                : tokens.length > 0
                  ? `${visibleAnalyses.length} of ${analyses.length} match “${deferredQuery.trim()}”`
                  : `${analyses.length} shown${filtered ? " with the current filters" : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[230px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-500"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search messages, signals, levels…"
                aria-label="Search saved analyses"
                maxLength={200}
                className="h-9 pl-9 pr-8 text-xs [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-stone-500 transition-colors hover:bg-white/[0.06] hover:text-stone-200"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9 w-[150px] text-xs" aria-label="Filter by risk level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                <SelectItem value="Low">Low risk</SelectItem>
                <SelectItem value="Medium">Medium risk</SelectItem>
                <SelectItem value="High">High risk</SelectItem>
                <SelectItem value="Critical">Critical risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 w-[140px] text-xs" aria-label="Filter by input type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="url">Links</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void load({ withStats: true })}
              disabled={loading}
              aria-label="Refresh history"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[13px] leading-5 text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
            <Button size="sm" variant="secondary" onClick={() => void load({ withStats: true })}>
              Try again
            </Button>
          </div>
        ) : null}

        {!hasLoaded || (loading && analyses.length === 0) ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="flex items-center gap-4 rounded-xl border border-border/60 p-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <EmptyHistory filtered={filtered} onClear={() => { setLevel("all"); setType("all"); }} />
        ) : visibleAnalyses.length === 0 ? (
          <EmptySearch
            query={deferredQuery.trim()}
            onClear={() => {
              setQuery("");
              setLevel("all");
              setType("all");
            }}
          />
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {visibleAnalyses.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                deleting={deletingId === item.id}
                onDelete={() => setPendingDelete(item)}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-[11px] leading-5 text-stone-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        History is stored in this demo's local SQLite database under an anonymous session ID in your
        browser. No account is created. Deleting an analysis removes it permanently — inputs may
        contain personal details, so clear them before sharing a device.
      </p>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this analysis?</DialogTitle>
            <DialogDescription>
              This removes the saved report and its extracted content from the local database. It
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {pendingDelete ? (
            <p className="rounded-lg border border-border/70 bg-black/25 p-3 font-mono text-[11px] leading-5 text-stone-400">
              {truncate(pendingDelete.rawInput, 180)}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              <Trash2 className="size-4" />
              Delete analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof ScanText;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-stone-400">
        <Icon className={cn("size-4", tone === "danger" ? "text-red-300/80" : "text-orange-300/80")} />
        <p className="text-[11px] font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-stone-500">{hint}</p>
    </div>
  );
}

function HistoryRow({
  item,
  deleting,
  onDelete,
}: {
  item: StoredAnalysis;
  deleting: boolean;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[item.inputType as keyof typeof TYPE_ICONS] ?? MessageSquare;
  const meta = RISK_META[item.riskLevel];

  return (
    <li className={cn("flex items-start gap-3 py-4 first:pt-0 last:pb-0", deleting && "opacity-50")}>
      <span
        className={cn(
          "mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border bg-white/[0.02]",
          meta.border,
          meta.text
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={item.riskLevel} />
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
            {INPUT_TYPE_LABEL[item.inputType] ?? item.inputType}
          </span>
          <span className="text-[10px] text-stone-600">·</span>
          <span className="text-[10px] tabular-nums text-stone-500" title={formatDateTime(item.createdAt)}>
            {formatRelative(item.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">
          {truncate(item.rawInput.replace(/\s+/g, " "), 120)}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-stone-500">{item.summary}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-stone-500">
          <span>Score {item.riskScore}/100</span>
          <span>Confidence {Math.round(item.confidence * 100)}%</span>
          <span>
            {item.signals.length} {item.signals.length === 1 ? "signal" : "signals"}
          </span>
          <span className={item.threatFeed === "verified" ? "text-orange-300/80" : ""}>
            {item.threatFeed === "verified" ? "Threat-feed checked" : "Heuristic analysis"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/report/${item.id}`}>
            Open
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete analysis"
          className="text-stone-500 hover:text-red-300"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-stone-400">
        <Search className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-foreground">No analyses match “{query}”</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-stone-400">
        Search checks the message text, summary, risk level, links, phone numbers and warning-sign
        labels. Try a shorter word, or clear the search and filters.
      </p>
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={onClear}>
          Clear search and filters
        </Button>
      </div>
    </div>
  );
}

function EmptyHistory({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border/80 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07] text-orange-300">
        <ScanText className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        {filtered ? "No analyses match these filters" : "No saved analyses yet"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-stone-400">
        {filtered
          ? "Try a different risk level or input type, or clear the filters to see everything."
          : "Paste a suspicious message, email or link into one of the analyzers. Every result is saved here automatically."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filtered ? (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
        <Button size="sm" asChild>
          <Link href="/analyze">Analyze a message</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/link">Check a link</Link>
        </Button>
      </div>
    </div>
  );
}
