import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { CommunityFeed } from "@/components/community-feed";
import { ToolPageHeader } from "@/components/tool-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Community scam feed",
  description:
    "The last 20 analyses run on FakeShield, anonymised: input type, risk score and the top warning sign only.",
};

export default function CommunityPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Community"
        title="See what everyone else is checking."
        description="A live, anonymised stream of the last 20 checks. It shows the shape of what people are receiving right now — risk levels, message types and the top warning sign — without exposing a single word of anyone's message."
        icon={Radio}
        badge={<Badge variant="outline">Anonymised · no raw text</Badge>}
      />

      <div className="mt-8">
        <CommunityFeed />
      </div>
    </div>
  );
}
