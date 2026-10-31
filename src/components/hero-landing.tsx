"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  EyeOff,
  Fingerprint,
  Gauge,
  Menu,
  Play,
  ScanLine,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { VideoBackground } from "@/components/video-background";
import { ThreatTicker } from "@/components/threat-ticker";
import { BrightnessToggle } from "@/components/brightness-toggle";
import { ScoreRing } from "@/components/score-ring";
import { HudCorners } from "@/components/hud-corners";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/analyze", label: "Analyze" },
  { href: "/image", label: "Screenshot" },
  { href: "/forward", label: "Forwards" },
  { href: "/link", label: "Links" },
  { href: "/trends", label: "Trends" },
  { href: "/learn", label: "Learn" },
];

const MORE_TOOLS = [
  { href: "/phone", label: "Phone lookup" },
  { href: "/language", label: "Hindi / regional" },
  { href: "/protect", label: "Family check" },
  { href: "/community", label: "Community feed" },
  { href: "/extension", label: "Extension" },
  { href: "/email", label: "Email" },
  { href: "/history", label: "History" },
];

const SAMPLES = [
  {
    id: "kyc-block",
    label: "Bank KYC SMS",
    tag: "Banking",
    verdict: "CRITICAL",
    color: "#f87171",
    preview: "“Your SBI account will be blocked today. Update KYC and share the OTP…”",
  },
  {
    id: "lottery",
    label: "Lottery win",
    tag: "Prize",
    verdict: "CRITICAL",
    color: "#f87171",
    preview: "“You won ₹25,00,000. Send Aadhaar, PAN and bank details to claim…”",
  },
  {
    id: "delivery-fee",
    label: "Delivery fee",
    tag: "Delivery",
    verdict: "HIGH",
    color: "#fb923c",
    preview: "“Your parcel is held. Pay ₹49 within 24 hours or it will be returned…”",
  },
];

const PREVIEW_SIGNALS = [
  "OTP or verification-code request",
  "Brand-lookalike domain",
  "Account suspension threat",
];

/**
 * Immersive landing page — the public face of FakeShield AI.
 *
 * Full-bleed background video with liquid-glass chrome, a live verdict preview
 * built from a real engine result (the KYC sample scores 100 / Critical), and
 * three one-click sample cases that deep-link into the analyzer.
 */
export function HeroLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="hero-shell relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#0b0704] text-white">
      {/* ── Background video ─────────────────────────────────────────── */}
      {/* Shares the site-wide gating logic: deferred load, poster first,
          reduced-motion stills, and pause when the tab is hidden. */}
      <VideoBackground opacity="var(--hero-video)" />
      <div
        className="hero-scrim pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,5,3,0.93) 0%, rgba(8,5,3,0.74) 38%, rgba(8,5,3,0.38) 68%, rgba(8,5,3,0.62) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="hero-vignette pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,5,3,0.6) 0%, rgba(8,5,3,0.12) 26%, rgba(8,5,3,0.74) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="hero-blob pointer-events-none absolute -left-40 top-1/3 hidden h-[540px] w-[540px] rounded-full blur-3xl sm:block"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.18), transparent 66%)" }}
        aria-hidden="true"
      />

      {/* ── Live ticker ──────────────────────────────────────────────── */}
      <ThreatTicker variant="hero" />

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="FakeShield AI home">
          <Logo />
        </Link>

        <nav
          aria-label="Landing navigation"
          className="liquid-glass hidden items-center gap-0.5 rounded-xl px-1.5 py-1.5 lg:flex"
        >
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <BrightnessToggle variant="hero" />
          <Link
            href="/demo"
            className="liquid-glass hidden h-9 items-center rounded-full px-4 text-[12px] font-semibold text-white/80 transition-colors hover:text-white sm:inline-flex"
          >
            Try the demo
          </Link>
          <Link
            href="/analyze"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-bold text-[#180a02] transition-colors hover:bg-white/90"
          >
            Analyze now
            <ArrowRight className="size-3.5" />
          </Link>
          <button
            type="button"
            className="liquid-glass grid size-9 place-items-center rounded-lg text-white lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────────────── */}
      {menuOpen ? (
        <div
          id="landing-menu"
          className="liquid-glass absolute left-4 right-4 top-[112px] z-30 rounded-2xl p-3 lg:hidden"
        >
          <nav aria-label="Mobile landing navigation" className="flex flex-col">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
                <ArrowRight className="size-3.5 opacity-40" />
              </Link>
            ))}
            <Link
              href="/history"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              History
              <ArrowRight className="size-3.5 opacity-40" />
            </Link>
            <Link
              href="/platform"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Platform overview
              <ArrowRight className="size-3.5 opacity-40" />
            </Link>
          </nav>
        </div>
      ) : null}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-5 pb-6 pt-2 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-orange-200/90 backdrop-blur-sm">
              <span className="live-dot" />
              Powered by FakeShield AI
            </span>

            <h1 className="mt-5 max-w-xl text-[2.5rem] font-extrabold leading-[1.03] tracking-tight sm:text-5xl xl:text-[3.7rem]">
              Spot the scam{" "}
              <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                before
              </span>{" "}
              it costs you.
            </h1>

            <p className="mt-5 max-w-lg text-[14px] leading-7 text-white/60 sm:text-[15px]">
              FakeShield AI dissects suspicious messages, emails and links — surfacing every
              warning sign in plain English, scoring the risk, and telling you exactly what to do
              next.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/analyze"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[13px] font-bold tracking-wide text-amber-950 transition-transform hover:-translate-y-px"
                style={{
                  background: "linear-gradient(135deg, #fdba74 0%, #fb923c 45%, #f97316 100%)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.25) inset, 0 10px 34px rgba(249,115,22,0.35)",
                }}
              >
                <ScanLine className="size-4" />
                Analyze a message
              </Link>
              <Link
                href="/demo"
                className="liquid-glass inline-flex h-12 items-center gap-2 rounded-full px-6 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Play className="size-3.5 fill-current" />
                Watch the 30-second demo
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <EyeOff className="size-3.5 text-orange-300/70" />
                Links never opened
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Fingerprint className="size-3.5 text-orange-300/70" />
                Anonymous session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="size-3.5 text-orange-300/70" />
                Explainable scores
              </span>
            </div>
          </div>

          {/* Live verdict glass card */}
          <div className="relative hidden lg:block">
            <div className="liquid-glass relative overflow-hidden rounded-2xl p-5">
              <HudCorners />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                  <span className="live-dot" />
                  Live triage
                </span>
                <span className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                  Sample
                </span>
              </div>

              <p className="mt-3 rounded-lg border border-white/[0.06] bg-black/35 p-3 font-mono text-[10.5px] leading-5 text-white/55">
                “Dear Customer, your SBI account will be blocked today. Update KYC and share the
                OTP…”
              </p>

              <div className="relative mt-4 flex items-center gap-4">
                <ScoreRing score={100} level="Critical" size={108} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[9.5px] uppercase tracking-wider text-white/40">
                    <span>Confidence</span>
                    <span className="font-bold tabular-nums text-white/80">95%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-amber-400 to-red-400" />
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] uppercase tracking-wider text-white/40">
                    <span>Signals</span>
                    <span className="font-bold tabular-nums text-white/80">9 found</span>
                  </div>
                  <ul className="space-y-1 pt-0.5">
                    {PREVIEW_SIGNALS.map((signal) => (
                      <li key={signal} className="flex items-center gap-1.5 text-[10.5px] text-white/65">
                        <span className="size-1 shrink-0 rounded-full bg-red-400" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[8.5px] uppercase tracking-[0.16em] text-white/35">
                  Links never fetched
                </span>
                <Link
                  href="/analyze?sample=kyc-block"
                  className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-orange-300 transition-colors hover:text-orange-200"
                >
                  Open this analysis
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
            <p className="mt-2 text-right font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/30">
              Illustrative sample · not live traffic
            </p>
          </div>
        </div>

        {/* ── One-click samples ──────────────────────────────────────── */}
        <div className="mx-auto mt-4 w-full max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              <Sparkles className="size-3 text-orange-300" />
              Or try a real example
            </h2>
            <Link
              href="/platform"
              className="hidden items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-white/40 transition-colors hover:text-white/70 sm:flex"
            >
              Explore the platform
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {SAMPLES.map((card) => (
              <Link
                key={card.id}
                href={`/analyze?sample=${card.id}`}
                className="group liquid-glass rounded-xl p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8.5px] font-bold uppercase tracking-widest text-white/40">
                    {card.tag}
                  </span>
                  <span
                    className="rounded-sm border px-1.5 py-0.5 text-[7.5px] font-black tracking-widest"
                    style={{
                      color: card.color,
                      borderColor: `${card.color}55`,
                      background: `${card.color}14`,
                    }}
                  >
                    {card.verdict}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-bold text-white">{card.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                  {card.preview}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-orange-300 transition-all group-hover:gap-2">
                  See analysis
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── More tools ─────────────────────────────────────────────── */}
        <div className="mx-auto mt-3 w-full max-w-6xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/35">
              More checks
            </span>
            {MORE_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm transition-colors hover:border-orange-400/30 hover:text-white"
              >
                <span className="size-1 rounded-full bg-orange-400/70" />
                {tool.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Branding + CTA strip ───────────────────────────────────── */}
        <div className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-white/40">
            <Shield className="size-3.5 text-orange-300/80" />
            Powered by <span className="font-semibold text-white/70">FakeShield AI</span>
            <span className="text-white/20">·</span>
            Risk guidance, not a final security verdict.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/platform"
              className="text-[11px] font-semibold text-white/55 transition-colors hover:text-white"
            >
              Platform overview
            </Link>
            <Link
              href="/analyze"
              className={cn(
                "liquid-glass inline-flex h-9 items-center gap-1.5 rounded-full px-4",
                "text-[11px] font-bold text-white transition-colors hover:bg-white/10"
              )}
            >
              Open the analyzer
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
