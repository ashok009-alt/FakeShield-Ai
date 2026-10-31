import type { Metadata } from "next";
import { PhoneCall, Users } from "lucide-react";
import { PhoneLookupClient } from "@/components/phone-client";
import { ToolPageHeader } from "@/components/tool-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Scam phone number lookup",
  description:
    "Check a phone number against community scam reports. See how many people reported it, what they reported, and what to do next.",
};

export default function PhonePage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Number lookup"
        title="Check who might be calling before you pick up."
        description="Scam callers reuse the same numbers for weeks. This lookup shows whether a number has been reported by this community, what pattern the reports follow, and how to respond without calling back."
        icon={PhoneCall}
        badge={
          <Badge variant="outline">
            <Users className="size-3" />
            Community-reported
          </Badge>
        }
      />

      <div className="mt-8">
        <PhoneLookupClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        The report counts shipped with this demo are illustrative and seeded locally — they are not
        a live Truecaller-style network. Reports you add stay in this local database. FakeShield
        never calls, texts or pings the number you search, and presence on this list is not a legal
        finding of fraud.
      </p>
    </div>
  );
}
