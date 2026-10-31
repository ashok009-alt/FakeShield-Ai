"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  MousePointerClick,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { analyzeMessage, analyzeUrl } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { reportPath } from "@/lib/report";
import { RISK_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoTab = {
  id: string;
  label: string;
  kind: "message" | "email" | "url";
  icon: typeof Globe;
  url: string;
  preview: { from?: string; lines: string[] };
  payload: string;
};

const TABS: DemoTab[] = [
  {
    id: "whatsapp",
    label: "WhatsApp Web",
    kind: "message",
    icon: MessageCircle,
    url: "https://web.whatsapp.com/",
    preview: {
      from: "Unknown +91 88XXXX 0199",
      lines: [
        "Dear customer, your electricity will be disconnected tonight.",
        "Call 88855 50199 and share the OTP to stop disconnection.",
        "Last warning from State Power Board.",
      ],
    },
    payload:
      "Dear customer, your electricity will be disconnected tonight as your bill is pending. Call our customer care and share the OTP sent to your mobile to stop disconnection. Last warning from State Power Board.",
  },
  {
    id: "gmail",
    label: "Gmail",
    kind: "email",
    icon: Mail,
    url: "https://mail.google.com/mail/u/0/#inbox",
    preview: {
      from: "SBI Customer Care <alerts@sbi-verify-secure.xyz>",
      lines: [
        "Subject: Immediate KYC suspension notice",
        "Your account will be blocked in 24 hours.",
        "Verify now at sbi-verify-secure.xyz/login and confirm your OTP.",
      ],
    },
    payload:
      "Your SBI account will be suspended in 24 hours because KYC is incomplete. Verify immediately at https://sbi-verify-secure.xyz/login and enter the OTP sent to your registered mobile. Ignoring this will permanently block your account.",
  },
  {
    id: "link",
    label: "Suspicious site",
    kind: "url",
    icon: Globe,
    url: "https://sbi-kyc-verify.xyz/login",
    preview: {
      lines: [
        "SBI Online Banking — KYC Verification",
        "Enter your account number, net banking password and OTP.",
        "This page is not the real SBI website.",
      ],
    },
    payload: "https://sbi-kyc-verify.xyz/login",
  },
];

export function ExtensionDemo() {
  const [active, setActive] = useState(TABS[0].id);
  const [results, setResults] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const tab = TABS.find((item) => item.id === active) ?? TABS[0];
  const result = results[tab.id];

  async function scan() {
    if (loading) return;
    setLoading(tab.id);
    try {
      const data =
        tab.kind === "url" ? await analyzeUrl(tab.payload) : await analyzeMessage(tab.payload);
      setResults((current) => ({ ...current, [tab.id]: data }));
      if (data.id) toast.success("Popup result ready");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "The demo scan failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          <MousePointerClick className="size-3" />
          Interactive concept
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          One click, before you reply.
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-stone-400">
          The popup reads the message you are looking at and shows a verdict beside it. This demo
          runs the real FakeShield engine on three sample tabs — it is not an installable extension.
        </p>

        <ol className="mt-5 space-y-4">
          {[
            {
              title: "Pin the shield",
              detail: "The extension sits beside the address bar and turns amber when a page looks risky.",
            },
            {
              title: "Click to scan",
              detail: "Scan the visible conversation, the open email, or the current URL — one request, no page screenshots.",
            },
            {
              title: "Act with context",
              detail: "The popup names the top warning signs and links to the full explanation in the app.",
            },
          ].map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-orange-500/25 bg-orange-500/10 text-[10px] font-bold text-orange-300">
                {index + 1}
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-stone-200">{step.title}</p>
                <p className="text-[11px] leading-5 text-stone-500">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3.5 py-3">
          <p className="flex items-start gap-2 text-[10.5px] leading-5 text-amber-200/80">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Concept preview only: there is no Chrome Web Store listing, no background tab access and
            no content script in this demo. Every scan below is a normal web request you trigger.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/message">
              Try the real analyzer
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href="https://developer.chrome.com/docs/extensions" target="_blank" rel="noreferrer noopener">
              How Chrome extensions work
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0805] shadow-2xl shadow-black/50">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-[#171009] px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/30 px-2 py-1">
            <ShieldCheck className="size-3 shrink-0 text-orange-300" />
            <span className="mono truncate text-[10px] text-stone-400">{tab.url}</span>
          </div>
          <span className="grid size-6 place-items-center rounded bg-orange-500/20 text-orange-300">
            <ShieldCheck className="size-3.5" />
          </span>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/[0.06] bg-[#120c07] px-2 py-1.5">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10.5px] transition-colors",
                  active === item.id
                    ? "bg-white/[0.07] text-stone-100"
                    : "text-stone-500 hover:bg-white/[0.03] hover:text-stone-300"
                )}
              >
                <Icon className="size-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative min-h-[420px] bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.08),transparent_55%)] p-4 sm:p-5">
          <div className="max-w-[78%] space-y-3 opacity-80">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              {tab.preview.from ? (
                <p className="text-[10.5px] font-medium text-stone-300">{tab.preview.from}</p>
              ) : null}
              {tab.preview.lines.map((line) => (
                <p key={line} className="mt-1.5 text-[10.5px] leading-5 text-stone-500">
                  {line}
                </p>
              ))}
              <div className="mt-3 h-7 w-24 rounded bg-white/[0.04]" />
            </div>
            <div className="h-2.5 w-3/4 rounded bg-white/[0.03]" />
            <div className="h-2.5 w-2/3 rounded bg-white/[0.025]" />
          </div>

          <div className="absolute right-3 top-3 w-[248px] overflow-hidden rounded-xl border border-white/10 bg-[#171009] shadow-2xl shadow-black/80 sm:right-5 sm:top-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded bg-orange-500/15">
                  <ShieldCheck className="size-3 text-orange-300" />
                </span>
                <span className="text-[10.5px] font-semibold text-white">FakeShield</span>
              </div>
              <span className="text-[8.5px] uppercase tracking-[0.12em] text-stone-500">Popup</span>
            </div>

            <div className="px-3 py-3">
              {result ? (
                <PopupResult result={result} />
              ) : (
                <>
                  <p className="text-[11px] font-medium text-stone-200">
                    {tab.kind === "url" ? "Check this site" : "Check this conversation"}
                  </p>
                  <p className="mt-1 text-[9.5px] leading-4 text-stone-500">
                    The demo sends only the text shown in this sample tab. No screenshot or page HTML
                    leaves your browser.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => void scan()}
                    disabled={Boolean(loading)}
                    className="mt-3 h-8 w-full text-[11px]"
                  >
                    {loading === tab.id ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Scanning…
                      </>
                    ) : (
                      <>
                        <ScanLine className="size-3" />
                        Scan this tab
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopupResult({ result }: { result: AnalysisResult }) {
  const meta = RISK_META[result.riskLevel];
  const Icon = result.riskScore >= 50 ? ShieldAlert : result.riskScore >= 25 ? AlertTriangle : CheckCircle2;
  const href = reportPath(result);
  const top = result.signals.slice(0, 2);

  return (
    <div>
      <div className={cn("flex items-center gap-2.5 rounded-lg border px-2.5 py-2", meta.border, meta.bg)}>
        <Icon className={cn("size-5 shrink-0", meta.text)} />
        <div>
          <p className={cn("text-[12px] font-semibold leading-tight", meta.text)}>{meta.label}</p>
          <p className="text-[9px] tabular-nums text-stone-500">{result.riskScore}/100 risk score</p>
        </div>
      </div>

      {top.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {top.map((signal) => (
            <li key={signal.id} className="flex items-start gap-1.5 text-[9.5px] leading-4 text-stone-400">
              <span className={cn("mt-1 size-1 shrink-0 rounded-full", meta.dot)} />
              {signal.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[9.5px] leading-4 text-stone-500">No named warning signs fired.</p>
      )}

      <div className="mt-2.5 flex items-center gap-1.5">
        {href ? (
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white/[0.06] px-2 py-1.5 text-[9.5px] font-medium text-stone-200 hover:bg-white/[0.09]"
          >
            Full report
            <ArrowRight className="size-2.5" />
          </Link>
        ) : null}
        <Link
          href={result.inputType === "url" ? "/link" : "/message"}
          className="inline-flex flex-1 items-center justify-center rounded-md bg-orange-500/15 px-2 py-1.5 text-[9.5px] font-medium text-orange-200 hover:bg-orange-500/25"
        >
          Open in app
        </Link>
      </div>
    </div>
  );
}
