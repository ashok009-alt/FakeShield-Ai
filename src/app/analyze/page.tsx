import type { Metadata } from "next";
import { Banknote, Fingerprint, KeyRound, Timer, Cpu, Zap } from "lucide-react";
import { AnalyzeClient } from "@/components/analyze-client";
import { RISK_META } from "@/lib/constants";
import type { RiskLevel } from "@/lib/analysis/types";

export const metadata: Metadata = {
  title: "Message analyzer",
  description:
    "Paste a suspicious SMS, WhatsApp message or any text. Get a transparent risk score, the warning signs found, and practical next steps.",
};

const CHECKS = [
  {
    icon: Timer,
    title: "Pressure & urgency",
    body: "Artificial deadlines, threats of suspension, and demands to act immediately.",
    color: "text-orange-400",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.15)",
  },
  {
    icon: Banknote,
    title: "Payment & financial bait",
    body: "UPI requests, refunds, prizes, investments, gift cards and unusual payment routes.",
    color: "text-amber-400",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.15)",
  },
  {
    icon: KeyRound,
    title: "Credential requests",
    body: "OTPs, PINs, passwords, CVVs and identity documents requested by message.",
    color: "text-red-400",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.15)",
  },
  {
    icon: Fingerprint,
    title: "Impersonation",
    body: "Bank, government, courier and brand names combined with unusual contact details.",
    color: "text-orange-200",
    bg: "rgba(180,83,9,0.08)",
    border: "rgba(180,83,9,0.15)",
  },
];

const LEVELS: { level: RiskLevel; range: string; body: string }[] = [
  { level: "Low", range: "0–24", body: "Few or no meaningful signals." },
  { level: "Medium", range: "25–49", body: "Some traits worth verifying." },
  { level: "High", range: "50–74", body: "Multiple strong warning signs." },
  { level: "Critical", range: "75–100", body: "Do not engage until verified." },
];

export default function AnalyzePage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      {/* Page header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400/80">
          <Cpu className="size-3.5" />
          Message analyzer
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Paste it.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #fb923c 0%, #b45309 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            See what&apos;s off.
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-stone-400">
          FakeShield AI extracts links, phone numbers and payment requests, then explains which
          scam patterns the message resembles. You get a confidence estimate, not a verdict.
        </p>
      </div>

      <div className="mt-10">
        <AnalyzeClient />
      </div>

      {/* What the engine checks */}
      <section className="mt-16" aria-labelledby="engine-checks">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="size-4 text-orange-400" />
          <h2 id="engine-checks" className="text-lg font-bold text-white">
            What the engine looks for
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHECKS.map((check) => (
            <div
              key={check.title}
              className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{ background: check.bg, border: `1px solid ${check.border}` }}
            >
              <check.icon className={`size-5 ${check.color}`} />
              <h3 className="mt-3 text-[13.5px] font-bold text-white">{check.title}</h3>
              <p className="mt-1.5 text-[12px] leading-5 text-stone-400">{check.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score bands */}
      <section className="mt-8" aria-labelledby="score-bands">
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{
            background: "linear-gradient(145deg, rgba(28,20,12,0.95) 0%, rgba(15,9,6,0.98) 100%)",
            border: "1px solid rgba(50,36,24,0.9)",
          }}
        >
          <h2 id="score-bands" className="text-sm font-bold text-white">
            How the risk score is mapped
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-stone-400">
            Each detected signal adds weight based on severity and how many categories it touches.
            Confidence reflects the number and diversity of signals — not certainty.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((item) => {
              const meta = RISK_META[item.level];
              return (
                <div
                  key={item.level}
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-bold ${meta.text}`}>{meta.label}</span>
                    <span className="font-mono text-[10px] text-stone-500">{item.range}</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-stone-400">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
