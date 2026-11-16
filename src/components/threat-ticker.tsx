"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slim "live feed" bar. The numbers are simulated demo telemetry — realistic
 * but clearly labelled, so the interface feels alive without claiming real
 * traffic. The marquee is pure CSS, pauses on hover, and stops entirely for
 * reduced-motion users.
 */
const FEED: { value: string; label: string }[] = [
  { value: "3", label: "OTP scams detected in the last 5 min" },
  { value: "12", label: "lookalike domains flagged today" },
  { value: "₹2.4L", label: "in fraudulent transfers intercepted this week" },
  { value: "7", label: "fake KYC kits quarantined this hour" },
  { value: "38", label: "suspicious links blocked today" },
  { value: "94%", label: "of scams open with urgency language" },
];

function FeedRow() {
  return (
    <div className="flex shrink-0 items-center">
      {FEED.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 whitespace-nowrap px-4 text-stone-400"
        >
          <span className="font-bold text-amber-300/90">{item.value}</span>
          <span>{item.label}</span>
          <span className="ml-2 inline-block size-1 rotate-45 bg-orange-500/50" />
        </span>
      ))}
    </div>
  );
}

export function ThreatTicker({ variant = "site" }: { variant?: "site" | "hero" }) {
  return (
    <div
      className={cn(
        "relative z-30 border-b border-slate-800/80 font-mono text-[10px] uppercase tracking-[0.14em]",
        variant === "hero"
          ? "bg-slate-950/80 backdrop-blur-md"
          : "bg-slate-950/90"
      )}
    >
      <div className="flex h-8 items-center">
        <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-slate-800 bg-slate-950 px-3 text-[9.5px] font-bold tracking-[0.18em] text-blue-400">
          <span className="live-dot" />
          Live Radar
        </span>

        <div className="ticker-viewport relative flex-1 overflow-hidden" aria-hidden="true">
          <div className="ticker-track flex w-max items-center">
            <FeedRow />
            <FeedRow />
          </div>
        </div>

        <span className="hidden h-full shrink-0 items-center border-l border-slate-800 px-3 text-[9px] tracking-[0.14em] text-slate-500 sm:flex">
          Simulated Feed
        </span>
        <Link
          href="/trends"
          className="hidden h-full shrink-0 items-center gap-1 border-l border-slate-800 px-3 text-[9.5px] font-bold tracking-[0.12em] text-blue-400 transition-colors hover:text-blue-300 md:flex"
        >
          View Telemetry
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <p className="sr-only">
        Simulated live threat feed: 3 OTP scams detected in the last 5 minutes, 12 lookalike
        domains flagged today, ₹2.4 lakh in fraudulent transfers intercepted this week. These are
        illustrative demo numbers, not measured traffic.
      </p>
    </div>
  );
}
