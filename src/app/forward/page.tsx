import type { Metadata } from "next";
import { Forward } from "lucide-react";
import { ForwardDetectorClient, ChainLegend } from "@/components/forward-client";
import { ToolPageHeader } from "@/components/tool-page-header";

export const metadata: Metadata = {
  title: "WhatsApp forward detector",
  description:
    "Paste a forwarded WhatsApp message to see whether it uses chain-letter wording, share-bait and unverifiable sources — and whether it also carries scam signals.",
};

export default function ForwardPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Forward detector"
        title="Did this message start somewhere you can trust?"
        description="Chain messages borrow urgency, blessings and “share with 10 people” pressure to travel. FakeShield separates spread-bait from actual scam signals, so you can decide whether the claim — or the sender — is the problem."
        icon={Forward}
      >
        <ChainLegend />
      </ToolPageHeader>

      <div className="mt-8">
        <ForwardDetectorClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        Forward checks are stored with your anonymous session so you can revisit them in History.
        Message text is never added to the public community feed. FakeShield AI provides risk
        guidance, not a final security verdict.
      </p>
    </div>
  );
}
