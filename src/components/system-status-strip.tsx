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
    <div className="hidden border-b border-slate-800/80 bg-slate-950/95 md:block">
      <div className="page-shell flex h-7 items-center justify-between gap-6 font-mono text-[9.5px] uppercase tracking-[0.16em] text-slate-400">
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="live-dot" />
            Threat Engine Online
          </span>
          <span className="h-3 w-px bg-slate-800" />
          <span>
            AI Core{" "}
            <span className={providers.gemini ? "text-blue-400" : "text-slate-300"}>
              {providers.gemini ? "Gemini Hybrid" : "40+ Deterministic Rules"}
            </span>
          </span>
          <span className="h-3 w-px bg-slate-800" />
          <span>
            Threat Intel{" "}
            <span className={threatCount > 0 ? "text-emerald-400" : "text-blue-400"}>
              {threatCount > 0 ? `${threatCount} Connected` : threatFeed ? "Safe Browsing" : "Registry Heuristics"}
            </span>
          </span>
          <span className="h-3 w-px bg-slate-800" />
          <span className="hidden lg:inline text-slate-400">Zero-Log Privacy</span>
        </div>

        <div className="flex items-center gap-3.5">
          <span className="hidden lg:inline text-slate-400">Anonymous Session</span>
          <span className="hidden h-3 w-px bg-slate-800 lg:inline-block" />
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500">UTC</span>
            <span className="text-slate-300">
              <UtcClock />
            </span>
          </span>
          <span className="h-3 w-px bg-slate-800" />
          <span className="text-slate-400">v2.0-Prod</span>
        </div>
      </div>
    </div>
  );
}
