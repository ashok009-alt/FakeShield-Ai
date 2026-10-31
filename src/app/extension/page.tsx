import type { Metadata } from "next";
import Link from "next/link";
import { Chrome, MousePointerClick, EyeOff, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { ExtensionDemo } from "@/components/extension-demo";
import { ToolPageHeader } from "@/components/tool-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Browser extension concept",
  description:
    "A concept preview of the FakeShield browser extension: scan the message or link in front of you without leaving the page.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "One click, no tab switch",
    detail: "The popup reads the visible text and returns a score in under a second on the local engine.",
  },
  {
    icon: MousePointerClick,
    title: "Right-click any selected text",
    detail: "Select a message, choose “Check with FakeShield”, and the verdict opens in a side panel.",
  },
  {
    icon: EyeOff,
    title: "No screenshots, no scraping",
    detail: "Only the text you choose is sent. The extension never uploads page pixels or browsing history.",
  },
  {
    icon: ShieldCheck,
    title: "Full reasoning stays available",
    detail: "The popup links to the same saved report as the web app, including every signal and its weight.",
  },
];

export default function ExtensionPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Browser extension"
        title="The shield, right beside the message."
        description="Phishing happens in the tab where you are already typing. This concept puts a scan button next to the conversation — and runs the same explainable engine as the site."
        icon={Chrome}
        badge={<Badge variant="warning">Concept preview · not installable</Badge>}
      />

      <div className="mt-8">
        <ExtensionDemo />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="surface rounded-2xl p-5">
              <span className="grid size-9 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
                <Icon className="size-4 text-orange-300" />
              </span>
              <h3 className="mt-3 text-[13px] font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-[11px] leading-5 text-stone-500">{feature.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-orange-300" />
            What a real release would need
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-stone-400">
            This page is a product concept, not a shipped extension. A production build would need
            each of these before it could be listed in the Chrome Web Store:
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "A minimal-permission manifest: activeTab and a user gesture only — no broad host access.",
              "A reviewable privacy policy explaining that selected text is sent to the analysis API.",
              "A content script that reads selected text locally and never captures screenshots.",
              "Versioned API keys held server-side, with per-install rate limits.",
              "An independent security review before any store listing.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[11.5px] leading-5 text-stone-400">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-400/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Where to start today</h2>
          <p className="mt-2 text-[12px] leading-6 text-stone-400">
            Until a real extension exists, the web analyzers cover the same workflow — open them in a
            second tab, or on your phone.
          </p>
          <div className="mt-4 space-y-2">
            {[
              { href: "/message", label: "Message analyzer", detail: "SMS, WhatsApp and chat text" },
              { href: "/link", label: "Link checker", detail: "URL structure and registry age" },
              { href: "/image", label: "Screenshot analyzer", detail: "OCR a screenshot locally" },
              { href: "/protect", label: "Family check", detail: "A simple YES / MAYBE / NO link" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-border bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:border-orange-500/30"
              >
                <span>
                  <span className="block text-[12px] font-medium text-stone-200">{item.label}</span>
                  <span className="block text-[10px] text-stone-500">{item.detail}</span>
                </span>
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <span className="text-stone-600 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-300" aria-hidden="true">
      →
    </span>
  );
}
