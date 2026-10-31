import type { Metadata } from "next";
import { HeartHandshake } from "lucide-react";
import { ProtectShareClient } from "@/components/protect-share";
import { ToolPageHeader } from "@/components/tool-page-header";

export const metadata: Metadata = {
  title: "Family protection mode",
  description:
    "Create a simple, shareable scam check for a parent or family member. One message in, a plain YES / MAYBE / NO answer out.",
};

export default function ProtectPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Family protection"
        title="A scam check your family can actually use."
        description="No dashboards, no signal weights, no jargon. Create a personal link; whoever opens it pastes a suspicious message and gets one large answer: YES, MAYBE or NO — plus three things to do next."
        icon={HeartHandshake}
      />

      <div className="mt-8">
        <ProtectShareClient />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Designed for a phone",
            detail: "Large type, one input and one button. It works on a low-end Android browser.",
          },
          {
            title: "No account needed",
            detail: "Nobody signs in. The shared page stores results only in that browser's session.",
          },
          {
            title: "Honest by default",
            detail: "MAYBE is a real answer. A low score never claims a message is definitely safe.",
          },
        ].map((item) => (
          <div key={item.title} className="surface rounded-2xl p-5">
            <h3 className="text-[13px] font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1.5 text-[11.5px] leading-5 text-stone-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
