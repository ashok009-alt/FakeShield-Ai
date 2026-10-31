"use client";

import { useMemo } from "react";
import type { AnalysisResult, Severity, Signal } from "@/lib/analysis/types";
import { SEVERITY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const MARK_CLASS: Record<Severity, string> = {
  critical:
    "bg-red-500/25 text-red-50 shadow-[inset_0_-2px_0_rgba(248,113,113,0.7)]",
  high: "bg-orange-500/25 text-orange-50 shadow-[inset_0_-2px_0_rgba(251,146,60,0.7)]",
  medium:
    "bg-amber-500/20 text-amber-50 shadow-[inset_0_-2px_0_rgba(251,191,36,0.65)]",
  low: "bg-yellow-500/15 text-yellow-50 shadow-[inset_0_-2px_0_rgba(250,204,21,0.5)]",
};

interface Segment {
  text: string;
  signal: Signal | null;
}

function escapeToken(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Locate a signal's stored evidence inside the original message. Evidence is
 * whitespace-collapsed and capped at 160 characters upstream, so try the full
 * phrase first and then progressively drop trailing tokens until a match is
 * found (a truncated tail would otherwise never match).
 */
function findMatches(text: string, evidence: string): Array<{ start: number; end: number }> {
  const tokens = evidence.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  for (let take = tokens.length; take > 0; take -= 1) {
    let regex: RegExp;
    try {
      regex = new RegExp(tokens.slice(0, take).map(escapeToken).join("\\s+"), "gi");
    } catch {
      continue;
    }
    const matches: Array<{ start: number; end: number }> = [];
    let match: RegExpExecArray | null;
    let guard = 0;
    while ((match = regex.exec(text)) !== null && guard < 8) {
      guard += 1;
      if (match[0].length > 0) {
        matches.push({ start: match.index, end: match.index + match[0].length });
      }
      if (regex.lastIndex === match.index) regex.lastIndex += 1;
    }
    if (matches.length > 0) return matches;
  }
  return [];
}

export function AnnotatedMessage({
  text,
  result,
  className,
}: {
  text: string;
  result: AnalysisResult;
  className?: string;
}) {
  const { segments, matchedSignals, phraseCount, structuralCount, hasHighlights } = useMemo(() => {
    const owners: (Signal | null)[] = new Array(text.length).fill(null);
    const matched = new Map<string, Signal>();
    const seenRanges = new Set<string>();
    let phraseCount = 0;

    for (const signal of result.signals) {
      if (!signal.evidence) continue;
      const ranges = findMatches(text, signal.evidence);
      for (const range of ranges) {
        const key = `${range.start}:${range.end}`;
        if (!seenRanges.has(key)) {
          seenRanges.add(key);
          phraseCount += 1;
        }
        for (let index = range.start; index < range.end; index += 1) {
          const current = owners[index];
          if (!current || SEVERITY_RANK[signal.severity] > SEVERITY_RANK[current.severity]) {
            owners[index] = signal;
          }
        }
      }
      if (ranges.length > 0) matched.set(signal.id, signal);
    }

    const segments: Segment[] = [];
    if (text.length > 0) {
      let start = 0;
      for (let index = 1; index <= text.length; index += 1) {
        if (index === text.length || owners[index] !== owners[start]) {
          segments.push({ text: text.slice(start, index), signal: owners[start] });
          start = index;
        }
      }
    }

    const matchedSignals = [...matched.values()].sort((a, b) => {
      const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      return bySeverity !== 0 ? bySeverity : b.weight - a.weight;
    });

    return {
      segments,
      matchedSignals,
      phraseCount,
      structuralCount: result.signals.length - matched.size,
      hasHighlights: matched.size > 0,
    };
  }, [text, result]);

  if (!text.trim()) return null;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {hasHighlights ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-200">
              {phraseCount} phrase{phraseCount === 1 ? "" : "s"} highlighted
            </span>
            <span className="text-[10px] text-stone-500">
              {matchedSignals.length} signal{matchedSignals.length === 1 ? "" : "s"} anchored to text
            </span>
          </>
        ) : (
          <span className="text-[10.5px] text-stone-500">
            {result.signals.length === 0
              ? "No warning phrases to highlight — no signals fired for this input."
              : "No quotable phrase matched — this verdict comes from structural checks."}
          </span>
        )}
      </div>

      <div className="max-h-[360px] overflow-auto rounded-xl border border-border/60 bg-black/25 p-3.5">
        <p className="whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-stone-300">
          {segments.map((segment, index) =>
            segment.signal ? (
              <mark
                key={`${index}-${segment.signal.id}`}
                title={`${segment.signal.label} · ${SEVERITY_META[segment.signal.severity].label} severity`}
                className={cn(
                  "rounded-[3px] px-0.5 py-px font-medium text-inherit",
                  MARK_CLASS[segment.signal.severity]
                )}
              >
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          )}
        </p>
      </div>

      {matchedSignals.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {matchedSignals.map((signal) => (
            <li
              key={signal.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] leading-4",
                SEVERITY_META[signal.severity].border,
                SEVERITY_META[signal.severity].bg,
                SEVERITY_META[signal.severity].text
              )}
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", SEVERITY_META[signal.severity].dot)}
              />
              {signal.label}
            </li>
          ))}
        </ul>
      ) : null}

      {structuralCount > 0 ? (
        <p className="mt-2 text-[10px] leading-4 text-stone-600">
          +{structuralCount} structural signal{structuralCount === 1 ? "" : "s"} (links, sender or
          formatting) with no single quotable phrase.
        </p>
      ) : null}
    </div>
  );
}
