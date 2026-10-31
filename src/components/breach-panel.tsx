"use client";

import { DatabaseZap, ShieldCheck, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { BreachResult } from "@/lib/analysis/types";
import { Badge } from "@/components/ui/badge";

/**
 * Have I Been Pwned result. The address is only sent when the user ticks the
 * consent box on the email form; without an API key nothing leaves the server.
 */
export function BreachPanel({ breach }: { breach?: BreachResult }) {
  if (!breach) return null;

  const tone =
    breach.status === "ok"
      ? { border: "border-amber-500/25", bg: "bg-amber-500/[0.05]", text: "text-amber-200" }
      : breach.status === "none"
        ? { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", text: "text-emerald-200" }
        : { border: "border-white/[0.08]", bg: "bg-white/[0.02]", text: "text-stone-300" };

  const Icon =
    breach.status === "ok"
      ? DatabaseZap
      : breach.status === "none"
        ? ShieldCheck
        : breach.status === "error"
          ? TriangleAlert
          : ShieldQuestion;

  return (
    <section className={`surface rounded-2xl border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className={`size-4 ${breach.status === "ok" ? "text-amber-300" : breach.status === "none" ? "text-emerald-300" : "text-stone-400"}`} />
          Breach history
        </h3>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">Have I Been Pwned</Badge>
          {breach.status === "ok" ? (
            <Badge variant="warning">{breach.breachCount} breach{breach.breachCount === 1 ? "" : "es"}</Badge>
          ) : null}
        </div>
      </div>

      <p className={`mt-2 text-[12px] leading-5 ${breach.status === "ok" ? "text-amber-100/80" : "text-stone-400"}`}>
        {breach.detail}
      </p>

      {breach.breaches && breach.breaches.length > 0 ? (
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-lg border border-white/[0.07] bg-black/20">
          {breach.breaches.map((item) => (
            <li key={`${item.name}-${item.breachDate ?? ""}`} className="px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-stone-200">{item.title}</span>
                {item.breachDate ? (
                  <span className="text-[10px] text-stone-500">{item.breachDate}</span>
                ) : null}
              </div>
              {item.dataClasses && item.dataClasses.length > 0 ? (
                <p className="mt-0.5 text-[10.5px] leading-5 text-stone-500">
                  Exposed: {item.dataClasses.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[10px] leading-5 text-stone-500">
        {breach.status === "not_configured"
          ? "No address was transmitted. Add HIBP_API_KEY on the server to enable consent-based breach checks."
          : "The sender address was sent to Have I Been Pwned only because you asked for this check. A breach means the address leaked elsewhere — it does not by itself prove this email is a scam."}
      </p>
    </section>
  );
}
