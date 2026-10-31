import type { Metadata } from "next";
import { DemoClient } from "@/components/demo-client";

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "Watch FakeShield AI tear apart a pre-seeded banking KYC scam — no typing required. The same server-side engine as the full analyzer, with every signal highlighted.",
};

export default function DemoPage() {
  return <DemoClient />;
}
