"use client";

import { useEffect, useRef } from "react";
import type { ProviderStatus } from "@/lib/intel/threatIntel";

function UtcClock() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Write straight to the DOM — a once-per-second React render of the whole
    // header strip is pure waste for a decorative clock.
    const tick = () => {
      el.textContent = new Date().toISOString().slice(11, 19);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span ref={ref} className="tabular-nums">
      --:--:--
    </span>
  );
}

/**
 * Thin operations bar above the main navigation.
 * Shows real, verifiable state: whether the optional threat feed is configured,
 * that the session is anonymous, and the current UTC time.
 */
export function SystemStatusStrip({
  threatFeed,
  providers,
}: {
  threatFeed: boolean;
  providers: ProviderStatus;
}) {
  const threatCount = [
    providers.safeBrowsing,
    providers.virusTotal,
    providers.shodan,
  ].filter(Boolean).length;

  return (
    <div className="hidden border-b border-[#2c1f14] bg-[#0b0704]/95 md:block">
      <div className="page-shell flex h-7 items-center justify-between gap-6 font-mono text-[9.5px] uppercase tracking-[0.16em] text-stone-500">
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="live-dot" />
            Engine online
          </span>
          <span className="h-3 w-px bg-[#382718]" />
          <span>
            AI{" "}
            <span className={providers.gemini ? "text-violet-300" : "text-amber-400/90"}>
              {providers.gemini ? "Gemini hybrid" : "rules only"}
            </span>
          </span>
          <span className="h-3 w-px bg-[#382718]" />
          <span>
            Threat feeds{" "}
            <span className={threatCount > 0 ? "text-emerald-400" : "text-amber-400/90"}>
              {threatCount > 0 ? `${threatCount} connected` : threatFeed ? "1 connected" : "heuristic only"}
            </span>
          </span>
          <span className="h-3 w-px bg-[#382718]" />
          <span className="hidden lg:inline">Links never fetched</span>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="hidden lg:inline">Anonymous session</span>
          <span className="hidden h-3 w-px bg-[#382718] lg:inline-block" />
          <span className="flex items-center gap-1.5">
            <span className="text-stone-600">UTC</span>
            <span className="text-stone-400">
              <UtcClock />
            </span>
          </span>
          <span className="h-3 w-px bg-[#382718]" />
          <span className="text-stone-600">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
