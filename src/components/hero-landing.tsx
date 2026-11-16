"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Smartphone,
  Globe,
  Mail,
  Camera,
  PhoneCall,
  Activity,
  Users,
  Compass,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThreatTicker } from "@/components/threat-ticker";
import { BrightnessToggle } from "@/components/brightness-toggle";
import { HomeAnalyzer } from "@/components/home-analyzer";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/analyze", label: "Message Analyzer" },
  { href: "/image", label: "Screenshot OCR" },
  { href: "/link", label: "Link Checker" },
  { href: "/email", label: "Phishing Email" },
  { href: "/forward", label: "WhatsApp Forwards" },
  { href: "/trends", label: "Threat Radar" },
  { href: "/learn", label: "Safety Center" },
];

const SCAN_MODES = [
  { href: "/analyze", label: "Text & SMS", icon: Smartphone, desc: "Bank alerts, job offers, OTP requests" },
  { href: "/link", label: "URL & Domain", icon: Globe, desc: "Lookalike domains, homographs & shorteners" },
  { href: "/email", label: "Email Header", icon: Mail, desc: "Sender spoofing, domain mismatch & billing" },
  { href: "/image", label: "Screenshot OCR", icon: Camera, desc: "100% private in-browser image scanning" },
  { href: "/phone", label: "Phone Lookup", icon: PhoneCall, desc: "Community fraud reports & blacklist check" },
];

const BENTO_FEATURES = [
  {
    title: "Explainable Risk Scoring (0–100)",
    subtitle: "Transparent intelligence, zero black-box mystery",
    desc: "Every verdict breaks down the exact linguistic urgency patterns, authority impersonation tactics, and payment lures detected with recomputable statistical weights.",
    icon: Activity,
    badge: "Deterministic Engine",
    href: "/about",
  },
  {
    title: "1-Click Cybercrime Complaint (1930)",
    subtitle: "Official legal draft for cybercrime.gov.in",
    desc: "When high or critical threats are flagged, instantly generate a structured incident summary complete with extracted URLs, phone numbers, and evidence checklist ready to file.",
    icon: FileText,
    badge: "Government Ready",
    href: "/analyze",
  },
  {
    title: "100% Client-Side Privacy OCR",
    subtitle: "Zero images ever uploaded to our servers",
    desc: "Upload WhatsApp or SMS screenshots with complete peace of mind. Optical character recognition runs locally in your browser via WebAssembly. Your photos never leave your device.",
    icon: Lock,
    badge: "Zero-Log Architecture",
    href: "/image",
  },
  {
    title: "Non-Invasive RDAP Domain Intel",
    subtitle: "Inspect threats without triggering malware",
    desc: "Examines domain age, young registrar warnings, punycode unicode tricks, and redirection chains via public registry lookups without opening or proxying malicious websites.",
    icon: Globe,
    badge: "Safe Registry Inspection",
    href: "/link",
  },
  {
    title: "Family Protection Mode (/protect)",
    subtitle: "Designed for parents, elders & non-tech users",
    desc: "Create a lightweight shareable link that presents a dead-simple YES / MAYBE / NO verdict with high-contrast instructions and no confusing cybersecurity jargon.",
    icon: Users,
    badge: "Senior-Friendly",
    href: "/protect",
  },
  {
    title: "Pan-India Threat Telemetry",
    subtitle: "Tracking emerging fraud across 36 states & UTs",
    desc: "Interactive choropleth map monitoring seasonal scam campaigns, digital arrest spikes, electricity bill hoaxes, and delivery fee traps circulating across Indian cities.",
    icon: Compass,
    badge: "Real-Time Trends",
    href: "/trends",
  },
];

const SCAM_PATTERNS = [
  {
    tag: "Banking",
    title: "Bank KYC & Account Freeze SMS",
    preview: "“Dear SBI Customer, your YONO account will be suspended today. Please update PAN immediately: sbi-kyc-verify.vip”",
    risk: "Critical Risk (98/100)",
    indicators: ["Lookalike domain (.vip)", "Urgency tactic (suspended today)", "Credential phishing"],
  },
  {
    tag: "Impersonation",
    title: "Digital Arrest & Fake Police Notice",
    preview: "“CBI / Mumbai Cyber Police notice: An illegal parcel containing contraband has been linked to your Aadhaar card. Join video call immediately…”",
    risk: "Critical Risk (100/100)",
    indicators: ["Law enforcement impersonation", "Coercion into video call", "False legal threat"],
  },
  {
    tag: "Utilities",
    title: "Electricity Power Disconnection",
    preview: "“Dear consumer, electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer immediately at 9876543210.”",
    risk: "High Risk (88/100)",
    indicators: ["Personal mobile number for official utility", "Artificial urgency", "Direct dial lure"],
  },
  {
    tag: "Employment",
    title: "Telegram Part-Time Like & Earn",
    preview: "“Earn ₹3,000–₹8,000 daily by rating Google Maps places and liking YouTube videos. No investment needed. Contact manager on Telegram…”",
    risk: "High Risk (85/100)",
    indicators: ["Unrealistic compensation", "Telegram redirection", "Pre-investment task scheme"],
  },
];

const STATS = [
  { value: "40+", label: "Detection Algorithms", sub: "Linguistic & semantic heuristics" },
  { value: "< 200ms", label: "Analysis Latency", sub: "Instant deterministic verdicts" },
  { value: "100%", label: "Privacy Zero-Log", sub: "Client-side WASM OCR processing" },
  { value: "1930", label: "Helpline Integration", sub: "Direct cybercrime complaint drafts" },
];

export function HeroLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#090d16] text-slate-100 selection:bg-blue-500/30 selection:text-white">
      {/* ── Top Ambient Atmosphere (No video, pure clean CSS) ─────────── */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full blur-[140px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.45) 0%, rgba(14, 165, 233, 0.15) 45%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 dot-matrix opacity-35" aria-hidden="true" />

      {/* ── Threat Live Ticker ────────────────────────────────────────── */}
      <ThreatTicker />

      {/* ── Navigation Bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="FakeShield AI home" className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Main Navigation" className="hidden items-center gap-1 xl:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <BrightnessToggle />
            <Link
              href="/analyze"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98]"
            >
              Scan a threat
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 xl:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen ? (
          <div className="border-t border-slate-800/80 bg-slate-950/98 px-5 py-4 xl:hidden">
            <nav className="flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800"
                >
                  {item.label}
                  <ChevronRight className="size-4 text-slate-500" />
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative z-10 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="page-shell">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Left column: High-Impact Typography & Trust */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-300">
                <span className="live-dot" />
                <span>AI SCAM DEFENSE PLATFORM • 1930 HELPLINE READY</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Stop digital scams{" "}
                <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  before
                </span>{" "}
                they reach your bank.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                FakeShield AI instantly inspects suspicious messages, emails, WhatsApp forwards, and links. Powered by 40+ transparent heuristic algorithms—with 1-click official complaint drafts for India’s National Cybercrime Portal.
              </p>

              {/* Quick mode switches */}
              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SCAN_MODES.slice(0, 3).map((mode) => (
                  <Link
                    key={mode.href}
                    href={mode.href}
                    className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 transition-all hover:border-slate-700 hover:bg-slate-900/90 group"
                  >
                    <div className="flex items-center gap-2 text-slate-200">
                      <mode.icon className="size-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <span className="text-xs font-semibold">{mode.label}</span>
                    </div>
                    <span className="mt-1 text-[11px] text-slate-400 line-clamp-1">{mode.desc}</span>
                  </Link>
                ))}
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  No login or account required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Zero image logs stored
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  100% Free & open-source
                </span>
              </div>
            </div>

            {/* Right column: Interactive Live Threat Scanner */}
            <div className="w-full">
              <HomeAnalyzer />
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Bar ──────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-slate-800/80 bg-slate-950/60 py-8 backdrop-blur-sm">
        <div className="page-shell">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white sm:text-3xl font-mono">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-200">{stat.label}</span>
                <span className="text-[11px] text-slate-400">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Grid: Core Capabilities (UI UX PRO MAX) ────────────── */}
      <section className="relative z-10 py-16 lg:py-24">
        <div className="page-shell">
          <div className="max-w-2xl">
            <span className="section-eyebrow">Enterprise Capabilities</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engineered for complete fraud resistance.
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Unlike generic AI chatbots that guess, FakeShield AI uses deterministic security heuristics, public registry telemetry, and official cyber defense frameworks.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENTO_FEATURES.map((item) => (
              <div
                key={item.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/20 transition-all hover:border-slate-700 hover:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid size-10 place-items-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <item.icon className="size-5" />
                    </span>
                    <span className="rounded-full border border-slate-700/80 bg-slate-800/70 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-300">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.subtitle}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.desc}</p>
                </div>

                <Link
                  href={item.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Explore tool
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real-World Scam Anatomy ──────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 py-16 lg:py-24">
        <div className="page-shell">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="section-eyebrow">Threat Pattern Library</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Common digital traps analyzed.
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Real messages and social engineering templates frequently weaponized against Indian citizens.
              </p>
            </div>
            <Link
              href="/patterns"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Browse all 15+ patterns
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SCAM_PATTERNS.map((scam) => (
              <div
                key={scam.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-slate-800 bg-slate-800/50 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                      {scam.tag}
                    </span>
                    <span className="text-[11px] font-bold text-red-400">{scam.risk}</span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-white">{scam.title}</h3>
                  <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[12px] italic leading-5 text-slate-400">
                    {scam.preview}
                  </div>

                  <ul className="mt-3.5 space-y-1.5">
                    {scam.indicators.map((ind) => (
                      <li key={ind} className="flex items-center gap-2 text-[11px] text-slate-300">
                        <AlertTriangle className="size-3 text-amber-400 shrink-0" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/analyze"
                  className="mt-5 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-blue-600 hover:border-blue-500 hover:text-white"
                >
                  Test this sample
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Official Cybercrime Reporting Help ───────────────────────── */}
      <section className="relative z-10 py-16">
        <div className="page-shell">
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
                <ShieldCheck className="size-3.5" />
                EMERGENCY ACTION STEPS
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Have you already shared an OTP or money?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Do not panic, but act immediately. The first 2 hours are crucial (the “Golden Hours”) to freeze fraudulent transactions before money is laundered.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="tel:1930"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-500 active:scale-[0.98]"
                >
                  <PhoneCall className="size-4" />
                  Call 1930 Helpline Now
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700"
                >
                  cybercrime.gov.in
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Professional Footer ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="page-shell flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="max-w-md text-[11px] leading-5 text-slate-500">
              FakeShield AI is an algorithmic risk guidance and heuristic threat intelligence platform. Results indicate potential danger indicators and do not replace official law enforcement advice.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-slate-400 font-medium">
            <Link href="/about" className="hover:text-white transition-colors">How Scoring Works</Link>
            <Link href="/learn" className="hover:text-white transition-colors">Safety Guides</Link>
            <Link href="/trends" className="hover:text-white transition-colors">Threat Radar</Link>
            <Link href="/protect" className="hover:text-white transition-colors">Family Protection</Link>
            <Link href="/patterns" className="hover:text-white transition-colors">Pattern Directory</Link>
          </div>
        </div>

        <div className="page-shell mt-8 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
          <span>© 2026 FakeShield AI • Designed for Indian Digital Security</span>
          <span>National Cyber Crime Portal Helpline: 1930</span>
        </div>
      </footer>
    </div>
  );
}
