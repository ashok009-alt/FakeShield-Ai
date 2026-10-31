import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { TrendsDashboard } from "@/components/trends-dashboard";
import { DigestSignup } from "@/components/digest-signup";
import { ToolPageHeader } from "@/components/tool-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Scam trend dashboard",
  description:
    "Weekly scam patterns in India: fastest-rising scam types, state-level report heat, and the scripts to watch this week.",
};

export default function TrendsPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Threat trends"
        title="What scammers are running this week."
        description="A weekly view of the scam types rising fastest, where reports cluster, and the scripts currently showing up in Indian inboxes. Read it like weather — useful context, not a forecast you can bet on."
        icon={Activity}
        badge={<Badge variant="warning">Illustrative dataset</Badge>}
      />

      <div className="mt-8">
        <TrendsDashboard />
      </div>

      <DigestSignup />

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        These figures are seeded for the demo and do not come from a live telecom or government feed.
        Real reporting is available through cybercrime.gov.in and the 1930 financial-fraud helpline.
      </p>
    </div>
  );
}
