import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  EyeOff,
  Gauge,
  Info,
  Layers,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About FakeShield AI",
  description:
    "Why FakeShield AI exists, how the analysis engine works, what it cannot do, and how this demo handles your data.",
};

const LIMITATIONS = [
  {
    title: "It can miss a scam",
    body: "The engine looks for known patterns: pressure language, credential requests, lookalike domains and payment bait. A carefully written or novel scam can avoid every rule, and a low score means only that no strong signals were found.",
  },
  {
    title: "It can flag a genuine message",
    body: "Legitimate marketing, bank alerts and delivery notices share vocabulary with scams. That is why the result shows the signals and an explanation instead of a single verdict.",
  },
  {
    title: "It cannot verify identity",
    body: "FakeShield does not call the sender, verify a company registration or confirm that a domain belongs to the brand it imitates. Only the organisation itself can do that.",
  },
  {
    title: "It is not a threat feed",
    body: "Without a Google Safe Browsing API key, URL checks are heuristic only. Even with the key, a clean lookup does not prove a site is safe — new malicious domains appear constantly.",
  },
];

export default function AboutPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">About</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Risk guidance for the moment before you click.
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
          FakeShield AI is a hackathon project built around a simple observation: most scam advice
          arrives too late. People forward suspicious messages after they have replied, or ask
          &ldquo;is this real?&rdquo; after entering a password. The tool is designed for the twenty
          seconds before that decision.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <section className="surface rounded-2xl p-5">
          <ScanLine className="size-5 text-orange-300" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">Explain, don't just score</h2>
          <p className="mt-2 text-[13px] leading-6 text-stone-400">
            Every rating is built from named signals with a plain-language explanation and a
            recommended action. The score is a summary of the reasoning, not a replacement for it.
          </p>
        </section>
        <section className="surface rounded-2xl p-5">
          <Gauge className="size-5 text-orange-300" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">Be honest about confidence</h2>
          <p className="mt-2 text-[13px] leading-6 text-stone-400">
            Confidence reflects how many signals were found, how severe they are and how varied they
            are. A single weak signal should not sound certain — and it doesn&apos;t.
          </p>
        </section>
        <section className="surface rounded-2xl p-5">
          <EyeOff className="size-5 text-orange-300" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">Never open what you submit</h2>
          <p className="mt-2 text-[13px] leading-6 text-stone-400">
            Submitted links are parsed as strings on the server. They are never rendered in an
            iframe, opened in a headless browser, or clicked on your behalf.
          </p>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="size-4.5 text-orange-300" />
          How the analysis works
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300/80">
              01 · Extract
            </p>
            <p className="mt-2 text-[13px] leading-6 text-stone-300">
              The input is normalised and mined for links, phone numbers, payment terms, amounts,
              brands and attachment names. Email headers are compared separately; URLs are broken
              into host, subdomain, path and parameters.
            </p>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300/80">
              02 · Match
            </p>
            <p className="mt-2 text-[13px] leading-6 text-stone-300">
              Modular rule sets detect urgency, fear, financial bait, credential requests,
              impersonation and formatting anomalies. Pattern rules combine signals — an OTP request
              plus a bank claim is treated differently from either alone.
            </p>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300/80">
              03 · Score
            </p>
            <p className="mt-2 text-[13px] leading-6 text-stone-300">
              Signals carry severity weights. The combined weight maps to a 0–100 score and a risk
              band (Low, Medium, High, Critical). Confidence comes from signal count, severity and
              diversity, capped so the tool never claims certainty.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-stone-500">
          With a <code className="rounded bg-white/[0.04] px-1 py-0.5 font-mono">GOOGLE_SAFE_BROWSING_API_KEY</code>{" "}
          configured, submitted URLs are additionally checked against Google&apos;s Safe Browsing
          lookup API on the server. The result is labelled &ldquo;Threat-feed verified&rdquo;.
          Otherwise it is labelled &ldquo;Heuristic analysis&rdquo;.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <TriangleAlert className="size-4.5 text-amber-300" />
          What this tool cannot do
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LIMITATIONS.map((item) => (
            <div key={item.title} className="surface rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-stone-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <LockKeyhole className="size-4.5 text-orange-300" />
            Privacy approach
          </h2>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-6 text-stone-400">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
              There are no accounts. A random anonymous ID is generated in your browser and sent
              with requests so history can be scoped to you.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
              Analyses are stored in a local SQLite database for this demo. They are not synced to a
              cloud account.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
              You can delete any analysis, and the whole history, from the History page. Deleting
              browser storage will orphan the old records — nothing else identifies you.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
              Do not paste real passwords, OTPs or full card numbers. The tool does not need them,
              and this build is not hardened for production secrets.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400/70" />
              API keys are read server-side only. No key is ever sent to the browser.
            </li>
          </ul>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Database className="size-4.5 text-orange-300" />
            Built with
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-stone-400">
            Next.js App Router and TypeScript, Tailwind CSS with shadcn/ui primitives, Framer Motion
            for restrained transitions, Zustand for history state, Recharts for the dashboard, and
            Prisma with SQLite for persistence. Analysis logic is a deterministic rule engine in{" "}
            <code className="rounded bg-white/[0.04] px-1 py-0.5 font-mono text-[11px]">
              lib/analysis
            </code>
            , served through validated API routes with Zod.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-3.5">
            <Info className="mt-0.5 size-3.5 shrink-0 text-orange-300" />
            <p className="text-[11px] leading-5 text-stone-400">
              This is an independent hackathon demo. It is not affiliated with any bank, courier,
              government agency or the brands mentioned in the example data.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/analyze"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-300"
            >
              <ShieldCheck className="size-4" />
              Try the analyzer
            </Link>
            <Link
              href="/learn"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white/[0.035] px-4 text-sm font-medium text-foreground transition-colors hover:border-stone-600"
            >
              Read the guides
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-8 max-w-3xl text-[11px] leading-5 text-stone-500">
        FakeShield AI provides risk guidance, not a final security verdict. If you have lost money
        or shared credentials, contact your bank immediately. In India you can report cyber fraud on
        cybercrime.gov.in or by calling 1930.
      </p>
    </div>
  );
}
