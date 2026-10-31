"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, Check, EyeOff, FileSearch, Fingerprint,
  Gauge, Layers, Link2, LockKeyhole, Mail, ShieldCheck,
  Sparkles, TriangleAlert, Zap, Target, Activity,
  AlertTriangle, Radio, Globe,
} from "lucide-react";
import { HomeAnalyzer } from "@/components/home-analyzer";
import { HeroShield3D } from "@/components/hero-shield-3d";
import { VideoBackground } from "@/components/video-background";
import { HudCorners } from "@/components/hud-corners";
import { TiltCard } from "@/components/tilt-card";
import { ParticleField } from "@/components/particle-field";
import { ThreatMeter } from "@/components/threat-meter";
import { AnimatedCounter } from "@/components/animated-counter";
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, RISK_META } from "@/lib/constants";
import { scamPatterns } from "@/lib/data/patterns";
import { learnGuides } from "@/lib/data/learn";

/* ─── Data ────────────────────────────────────────────────────────── */
const HELPS = [
  {
    icon: FileSearch,
    title: "Message Analysis",
    body: "Deep-scan any SMS, WhatsApp, or chat message for urgency manipulation, impersonation, payment pressure, and credential harvesting.",
    href: "/analyze",
    linkLabel: "Open analyzer",
    accent: "#f97316",
    accentBg: "rgba(249,115,22,0.07)",
    accentBorder: "rgba(249,115,22,0.2)",
  },
  {
    icon: Globe,
    title: "URL Threat Scanner",
    body: "Parse and classify any URL for lookalike domains, typosquatting, suspicious TLDs, and known threat-feed hits — without loading the page.",
    href: "/link",
    linkLabel: "Scan a URL",
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.07)",
    accentBorder: "rgba(245,158,11,0.2)",
  },
  {
    icon: Layers,
    title: "Incident Response",
    body: "Get a structured remediation playbook matched to your specific threat type — not generic warnings.",
    href: "/learn",
    linkLabel: "Browse guides",
    accent: "#22c55e",
    accentBg: "rgba(34,197,94,0.07)",
    accentBorder: "rgba(34,197,94,0.2)",
  },
];

const TRUST = [
  { icon: EyeOff, label: "Links never opened or rendered", color: "#fb923c" },
  { icon: Fingerprint, label: "Anonymous browser-scoped session", color: "#fbbf24" },
  { icon: Gauge, label: "Confidence scores always shown", color: "#34d399" },
  { icon: ShieldCheck, label: "Delete any record at any time", color: "#fbbf24" },
];

const COVERAGE = [
  { id: "fake-bank-kyc", label: "Fake Bank KYC", tag: "Finance", sev: "CRITICAL" },
  { id: "otp-fraud", label: "OTP Fraud", tag: "Auth", sev: "CRITICAL" },
  { id: "fake-delivery-fee", label: "Delivery Fee Scams", tag: "Delivery", sev: "HIGH" },
  { id: "fake-job-offer", label: "Fake Job Offers", tag: "Social", sev: "HIGH" },
  { id: "investment-crypto", label: "Crypto Investment", tag: "Finance", sev: "HIGH" },
  { id: "fake-customer-support", label: "Support Impersonation", tag: "Social", sev: "MEDIUM" },
];

const SEV_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.28)", text: "#f87171" },
  HIGH: { bg: "rgba(249,115,22,0.09)", border: "rgba(249,115,22,0.25)", text: "#fb923c" },
  MEDIUM: { bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.25)", text: "#fbbf24" },
};

const STATS = [
  { end: 6, suffix: "+", label: "Threat categories", color: "#fb923c", icon: Target },
  { end: 2, suffix: "s", label: "Max detection time", color: "#34d399", icon: Zap },
  { end: 100, suffix: "%", label: "Local processing", color: "#fbbf24", icon: LockKeyhole },
  { end: 0, suffix: "", label: "Links fetched", color: "#fbbf24", icon: EyeOff },
];

/* ─── Fade-in-up wrapper ──────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#3a2a1c]">
        {/* Readability scrim over the fixed site-wide background video */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 0,
            background:
              "linear-gradient(100deg, rgba(11,7,4,0.88) 0%, rgba(11,7,4,0.62) 32%, rgba(11,7,4,0.16) 64%, rgba(11,7,4,0) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Extra contrast for stacked mobile layouts */}
        <div
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(11,7,4,0.5) 0%, rgba(11,7,4,0.28) 60%, rgba(11,7,4,0.5) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Particle canvas above the scrim */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <ParticleField count={42} connectDistance={110} maxSpeed={0.18} />
        </div>
        {/* Hex texture on top of particles */}
        <div className="pointer-events-none absolute inset-0 hex-grid opacity-15" style={{ zIndex: 1 }} aria-hidden="true" />
        {/* Ambient top glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px]"
          style={{ zIndex: 1, background: "radial-gradient(ellipse, rgba(249,115,22,0.09) 0%, transparent 65%)" }}
          aria-hidden="true"
        />
        {/* Soft fade into the next section */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0704] to-transparent"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        />

        <div className="page-shell relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:py-24" style={{ zIndex: 2 }}>
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="flex items-center gap-1.5 rounded-sm border border-[#3a2a1c] bg-[#171009] px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-stone-400">
                <span className="live-dot" />
                THREAT INTELLIGENCE PLATFORM
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl xl:text-[3.4rem]"
            >
              Identify threats{" "}
              <span className="headline-accent">before</span>{" "}
              they reach you.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 max-w-lg text-[15px] leading-[1.8] text-stone-400"
            >
              FakeShield AI is a heuristic + AI engine that dissects suspicious
              messages, emails and URLs — surfacing every attack vector with plain-English
              evidence and an actionable response plan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/analyze"
                className="inline-flex h-11 items-center gap-2.5 rounded-sm px-6 text-[13px] font-bold tracking-wide text-amber-950 transition-all hover:brightness-110 hover:-translate-y-px"
                style={{
                  background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 20px rgba(249,115,22,0.4)",
                  letterSpacing: "0.05em",
                }}
              >
                <AlertTriangle className="size-4" />
                ANALYZE A THREAT
              </Link>
              <Link
                href="/link"
                className="inline-flex h-11 items-center gap-2.5 rounded-sm border border-[#4a3422] bg-[#171009] px-6 text-[13px] font-semibold text-stone-200 transition-all hover:border-stone-500 hover:bg-[#1d130a]"
                style={{ letterSpacing: "0.03em" }}
              >
                <Globe className="size-4 text-amber-400" />
                SCAN A URL
              </Link>
            </motion.div>

            {/* Live telemetry — real counts from the shipped content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-stone-600"
            >
              <span className="text-stone-500">Telemetry</span>
              <span className="h-3 w-px bg-[#3a2a1c]" aria-hidden="true" />
              <span>
                Signals <b className="font-semibold text-amber-300/90">87</b>
              </span>
              <span>
                Patterns <b className="font-semibold text-amber-300/90">{scamPatterns.length}</b>
              </span>
              <span>
                Guides <b className="font-semibold text-amber-300/90">{learnGuides.length}</b>
              </span>
              <span className="flex items-center gap-1.5">
                Store <b className="font-semibold text-emerald-300/80">Local</b>
              </span>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-9 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-[#3a2a1c] pt-7 max-w-sm"
            >
              {TRUST.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="size-3.5 shrink-0" style={{ color: item.color }} />
                  <span className="text-[11.5px] leading-5 text-stone-400">{item.label}</span>
                </div>
              ))}
            </motion.div>

            <p className="mt-4 flex items-center gap-1.5 text-[10.5px] text-stone-600">
              <TriangleAlert className="size-3 shrink-0 text-amber-600/60" />
              Risk guidance only — not a certified security verdict.
            </p>
          </div>

          {/* Right: 3D shield + analyzer */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* 3D animated threat network */}
            <HeroShield3D />
          </motion.div>
        </div>
      </section>

      {/* ══ LIVE ANALYZER ═════════════════════════════════════════════════ */}
      <section className="relative border-b border-[#3a2a1c]" style={{ background: "linear-gradient(160deg,rgba(18,12,8,0.78) 0%,rgba(11,7,4,0.88) 100%)" }}>
        <div className="texture-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true" />
        <div className="page-shell relative py-14 sm:py-18">
          <FadeUp className="max-w-2xl mb-10">
            <p className="section-eyebrow mb-4">Live threat scanner</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Paste a message. Get a verdict in seconds.
            </h2>
            <p className="mt-3 text-[14.5px] leading-7 text-stone-400">
              The engine runs heuristic + pattern matching on your text, extracts every embedded
              artifact, and maps them to known attack taxonomies.
            </p>
          </FadeUp>
          <FadeUp delay={0.15}>
            <TiltCard
              className="relative rounded-sm overflow-visible"
              style={{
                background: "linear-gradient(160deg, #201509 0%, #0f0906 100%)",
                border: "1px solid #4a3422",
                boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.05) inset",
              }}
              strength={6}
            >
              <div className="p-6 sm:p-7">
                <HomeAnalyzer />
              </div>
            </TiltCard>
          </FadeUp>
        </div>
      </section>

      {/* ══ ANIMATED STATS ════════════════════════════════════════════════ */}
      <section
        className="relative border-b border-[#3a2a1c]"
        style={{ background: "linear-gradient(90deg, rgba(11,7,4,0.64) 0%, rgba(20,13,8,0.72) 50%, rgba(11,7,4,0.64) 100%)" }}
      >
        <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" />
        <div className="page-shell relative py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.08}>
                <TiltCard
                  className="flex items-center gap-4 rounded-sm border border-[#3a2a1c] bg-[#171009] px-5 py-4"
                  strength={8}
                  glare
                >
                  <stat.icon className="size-5 shrink-0 opacity-70" style={{ color: stat.color }} />
                  <div>
                    <div className="text-[2rem] font-black leading-none" style={{ color: stat.color }}>
                      <AnimatedCounter value={stat.end} suffix={stat.suffix} />
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                </TiltCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CAPABILITY CARDS ══════════════════════════════════════════════ */}
      <section className="page-shell py-16 sm:py-20">
        <FadeUp className="max-w-2xl mb-10">
          <p className="section-eyebrow mb-4">Core capabilities</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Three modules. One platform.
          </h2>
          <p className="mt-3 text-[14.5px] leading-7 text-stone-400">
            Each module produces structured evidence output — not just a score.
          </p>
        </FadeUp>

        <div className="grid gap-4 md:grid-cols-3">
          {HELPS.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.1}>
              <TiltCard
                className="group relative flex flex-col h-full rounded-sm transition-all duration-200"
                style={{
                  background: `linear-gradient(160deg, ${item.accentBg} 0%, rgba(23,16,9,0.97) 60%)`,
                  border: `1px solid ${item.accentBorder}`,
                  boxShadow: "0 8px 32px -16px rgba(0,0,0,0.6)",
                }}
                strength={10}
                glare
              >
                {/* Module label */}
                <div
                  className="flex items-center justify-between border-b px-5 py-3"
                  style={{ borderColor: item.accentBorder }}
                >
                  <span
                    className="text-[10px] font-black tracking-[0.18em] uppercase"
                    style={{ color: item.accent }}
                  >
                    Module 0{i + 1}
                  </span>
                  <item.icon className="size-4 opacity-70" style={{ color: item.accent }} />
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-[15px] font-bold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-6 text-stone-400">{item.body}</p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide uppercase transition-all duration-150 hover:gap-3"
                    style={{ color: item.accent, letterSpacing: "0.06em" }}
                  >
                    {item.linkLabel}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </TiltCard>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ THREAT METER + EXPLAINABILITY ═════════════════════════════════ */}
      <section
        className="relative overflow-hidden border-y border-[#3a2a1c]"
        style={{ background: "linear-gradient(160deg, rgba(18,12,8,0.76) 0%, rgba(11,7,4,0.87) 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 circuit-bg opacity-25" aria-hidden="true" />
        <div className="page-shell relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-start">

          {/* Left: explainability */}
          <FadeUp>
            <p className="section-eyebrow mb-4">Analysis depth</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Evidence-based. Not a black box.
            </h2>
            <p className="mt-4 max-w-lg text-[14.5px] leading-7 text-stone-400">
              Every detection is backed by named evidence — the exact phrase, domain, or pattern
              that triggered it — with severity ratings and a direct remediation step.
            </p>
            <ul className="mt-7 space-y-2.5">
              {[
                "Urgency and fear language patterns",
                "OTP, PIN and credential harvest attempts",
                "Lookalike & typosquatted domain detection",
                "Sender / Reply-To header mismatches",
                "Payment, refund and prize lure taxonomy",
                "Multi-signal scam pattern combinatorics",
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 text-[13.5px] text-stone-300"
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-sm"
                    style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}
                  >
                    <Check className="size-3 text-amber-400" strokeWidth={3} />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/email"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#4a3422] bg-[#171009] px-4 text-[13px] font-semibold text-stone-200 hover:border-stone-500 transition-colors"
              >
                <Mail className="size-4 text-amber-400" />
                Email analyzer
              </Link>
              <Link
                href="/patterns"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#3a2a1c] bg-transparent px-4 text-[13px] font-semibold text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] transition-colors"
              >
                <Sparkles className="size-4 text-amber-400" />
                Pattern library
              </Link>
            </div>
          </FadeUp>

          {/* Right: animated threat meter */}
          <FadeUp delay={0.2}>
            <TiltCard
              className="relative overflow-hidden rounded-sm p-5 sm:p-6"
              style={{
                background: "linear-gradient(160deg, #201509 0%, #0f0906 100%)",
                border: "1px solid #4a3422",
                boxShadow: "0 0 0 1px rgba(249,115,22,0.04) inset, 0 20px 60px -30px rgba(0,0,0,0.8)",
              }}
              strength={7}
              glare
            >
              <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true" />
              <HudCorners />
              <div className="relative flex items-center justify-between border-b border-[#3a2a1c] pb-4 mb-5">
                <div className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-white">
                  <Activity className="size-4 text-amber-400" />
                  THREAT FREQUENCY ANALYSIS
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500">
                  <span className="live-dot" />
                  SAMPLE MODEL
                </span>
              </div>
              <ThreatMeter />
              <p className="mt-3 text-[10.5px] leading-4 text-stone-500">
                Illustrative weighting across the shipped pattern library — not measured traffic.
              </p>
              <div
                className="mt-5 rounded-sm px-4 py-3"
                style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)" }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                  Engine verdict example
                </p>
                <p className="text-[12.5px] leading-5 text-stone-300">
                  OTP phishing + account-suspension threat + unregistered domain →{" "}
                  <span className="font-bold text-red-400">CRITICAL risk</span>.
                  Do not share the OTP. Contact your bank directly.
                </p>
              </div>
            </TiltCard>
          </FadeUp>
        </div>
      </section>

      {/* ══ COVERAGE ══════════════════════════════════════════════════════ */}
      <section className="page-shell py-16 sm:py-20">
        <FadeUp className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div className="max-w-xl">
            <p className="section-eyebrow mb-4">Threat coverage</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Modelled on real-world attacks.
            </h2>
          </div>
          <Link
            href="/patterns"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wider uppercase text-amber-400 hover:text-amber-300 transition-colors"
          >
            All {scamPatterns.length} patterns <ArrowRight className="size-4" />
          </Link>
        </FadeUp>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COVERAGE.map((item, i) => {
            const sc = SEV_STYLE[item.sev];
            return (
              <FadeUp key={item.id} delay={i * 0.07}>
                <TiltCard
                  className="group flex items-center justify-between rounded-sm border px-5 py-4 transition-all duration-150 hover:border-[#5c4129]"
                  style={{ background: "rgba(23,16,9,0.7)", border: "1px solid #3a2a1c" }}
                  strength={6}
                  glare
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase"
                      style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                    >
                      {item.sev}
                    </span>
                    <span className="text-[13.5px] font-semibold text-stone-300 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">{item.tag}</span>
                    <ArrowRight className="size-3.5 text-stone-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </TiltCard>
              </FadeUp>
            );
          })}
        </div>

        {/* Risk bands */}
        <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(["Low", "Medium", "High", "Critical"] as const).map((level, i) => {
            const c = {
              Low: { accent: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.18)", range: "0–24" },
              Medium: { accent: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", range: "25–49" },
              High: { accent: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.18)", range: "50–74" },
              Critical: { accent: "#ef4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", range: "75–100" },
            }[level];
            return (
              <FadeUp key={level} delay={i * 0.08}>
                <div
                  className="rounded-sm px-4 py-4"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: c.accent }}>
                      {level}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">{c.range}</span>
                  </div>
                  <motion.div
                    className="h-[3px] w-full rounded-full mb-2"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: c.accent }}
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${level === "Low" ? 25 : level === "Medium" ? 50 : level === "High" ? 75 : 100}%`,
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </motion.div>
                  <p className="text-[11.5px] leading-5 text-stone-500">{RISK_META[level].description}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ══ PRIVACY ═══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden border-y border-[#3a2a1c]"
        style={{ background: "linear-gradient(160deg, rgba(18,12,8,0.76) 0%, rgba(11,7,4,0.87) 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0 dot-matrix opacity-18" aria-hidden="true" />
        <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" />
        <div className="page-shell relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-start">
          <FadeUp>
            <h2 className="flex items-start gap-3 text-xl font-bold text-white">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-sm mt-0.5"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}
              >
                <LockKeyhole className="size-4.5 text-amber-400" />
              </span>
              Privacy-first architecture
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-7 text-stone-400">
              Zero accounts. A random anonymous session ID scopes all history to your browser.
              Nothing is synced to a cloud server. You control and can delete every record.
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-bold tracking-wide uppercase text-amber-400 hover:text-amber-300 transition-colors"
            >
              Architecture overview <ArrowRight className="size-3.5" />
            </Link>
          </FadeUp>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: EyeOff, title: "No link execution", body: "URLs are parsed server-side — never fetched or rendered.", color: "#fb923c" },
              { icon: Fingerprint, title: "Pseudonymous session", body: "No login, email, or profile. A local UUID scopes history.", color: "#fbbf24" },
              { icon: Gauge, title: "Calibrated confidence", body: "Confidence is bounded and explained — weak matches are never overstated.", color: "#34d399" },
              { icon: ShieldCheck, title: "Deletable records", body: "Every saved report is removable from History with one click.", color: "#fbbf24" },
            ].map((card, i) => (
              <FadeUp key={card.title} delay={i * 0.08}>
                <TiltCard
                  className="rounded-sm border border-[#3a2a1c] p-4 transition-colors hover:border-[#5c4129] h-full"
                  style={{ background: "linear-gradient(160deg, #1c120a 0%, #100a06 100%)" }}
                  strength={8}
                  glare
                >
                  <card.icon className="size-4.5 mb-3" style={{ color: card.color }} />
                  <p className="text-[13px] font-bold text-white mb-1">{card.title}</p>
                  <p className="text-[12px] leading-5 text-stone-500">{card.body}</p>
                </TiltCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="page-shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <FadeUp>
            <p className="section-eyebrow mb-4">Documentation</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How the engine works.
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-6 text-stone-400">
              FakeShield AI is a hackathon-grade triage system. Read about detection
              methodology, data handling, and known limitations.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/about" className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#4a3422] bg-[#171009] px-4 text-[13px] font-semibold text-stone-200 hover:border-stone-500 transition-colors">
                About &amp; limitations
              </Link>
              <Link href="/learn" className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#3a2a1c] bg-transparent px-4 text-[13px] font-semibold text-stone-400 hover:text-stone-200 hover:bg-white/[0.03] transition-colors">
                {learnGuides.length} response guides
              </Link>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div
              className="rounded-sm px-5 sm:px-6"
              style={{ background: "linear-gradient(160deg, #201509 0%, #0f0906 100%)", border: "1px solid #3a2a1c" }}
            >
              <Accordion type="single" collapsible>
                {FAQS.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="last:border-b-0">
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════ */}
      <section className="page-shell pb-20">
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-sm px-8 py-14 text-center sm:px-12 sm:py-16"
            style={{
              background: "linear-gradient(160deg, #2a1808 0%, #140c06 50%, #2a1808 100%)",
              border: "1px solid #4a3422",
              boxShadow: "0 0 0 1px rgba(249,115,22,0.06) inset, 0 40px 100px -40px rgba(0,0,0,0.8)",
            }}
          >
            {/* Background video, same motif as the hero */}
            <VideoBackground
              still
              opacity={0.4}
              overlayClassName="bg-[linear-gradient(180deg,rgba(11,7,4,0.86),rgba(20,13,8,0.93))]"
            />
            <div className="pointer-events-none absolute inset-0 circuit-bg opacity-20" aria-hidden="true" />
            <div className="texture-noise pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden="true" />
            <HudCorners className="inset-2.5" />
            {/* Top ambient */}
            <div
              className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full opacity-40"
              style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.35), transparent)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-2 rounded-sm border px-3 py-1 text-[10px] font-black tracking-widest uppercase mb-5"
                style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}
              >
                <Radio className="size-3" />
                Threat analysis ready
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Something look suspicious?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-7 text-stone-400">
                Paste it in. The engine scans for attack patterns in under 2 seconds and
                returns a full evidence report with a recommended response.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/analyze"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm px-8 text-[13px] font-bold tracking-wide text-amber-950"
                    style={{
                      background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
                      boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 20px rgba(249,115,22,0.4)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <AlertTriangle className="size-4" />
                    ANALYZE A THREAT
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/email"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-[#4a3422] bg-[#171009] px-7 text-[13px] font-semibold text-stone-200 hover:border-stone-500 transition-colors"
                    style={{ letterSpacing: "0.03em" }}
                  >
                    <Mail className="size-4 text-amber-400" />
                    EMAIL ANALYZER
                  </Link>
                </motion.div>
              </div>
              <p className="mt-6 text-[10.5px] text-stone-600">
                FakeShield AI provides risk guidance only — not a certified security verdict.
              </p>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
