"use client";

import { toast } from "sonner";
import {
  Building2,
  Clock,
  Globe,
  IndianRupee,
  Paperclip,
  Phone,
  Wallet,
} from "lucide-react";
import type { ExtractedEntities } from "@/lib/analysis/types";
import { copyText } from "@/lib/utils";

const SECTIONS = [
  { key: "urls" as const, label: "Links", icon: Globe, hint: "Shown as text — never opened" },
  { key: "phoneNumbers" as const, label: "Phone numbers", icon: Phone },
  { key: "paymentKeywords" as const, label: "Payment terms", icon: Wallet },
  { key: "urgencyPhrases" as const, label: "Urgency phrases", icon: Clock },
  { key: "amounts" as const, label: "Amounts mentioned", icon: IndianRupee },
  { key: "brands" as const, label: "Brands mentioned", icon: Building2 },
  { key: "attachments" as const, label: "Attachments", icon: Paperclip },
];

export function ExtractedPanel({ extracted }: { extracted: ExtractedEntities }) {
  const sections = SECTIONS.filter((section) => {
    const values = extracted[section.key];
    return Array.isArray(values) && values.length > 0;
  });

  if (sections.length === 0) return null;

  async function handleCopy(value: string) {
    const ok = await copyText(value);
    if (ok) toast.success("Copied", { description: value.slice(0, 60) });
    else toast.error("Could not copy to clipboard.");
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const Icon = section.icon;
        const values = extracted[section.key];
        return (
          <div key={section.key}>
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 text-stone-500" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                {section.label}
              </h4>
              {section.hint ? (
                <span className="text-[10px] text-stone-600">· {section.hint}</span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {values.map((value) => (
                <button
                  key={`${section.key}-${value}`}
                  type="button"
                  onClick={() => handleCopy(value)}
                  title="Copy"
                  className="mono max-w-full truncate rounded-md border border-border/80 bg-white/[0.03] px-2 py-1 text-[11px] text-stone-300 transition-colors hover:border-orange-500/30 hover:text-orange-200"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
