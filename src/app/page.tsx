import type { Metadata } from "next";
import { HeroLanding } from "@/components/hero-landing";

export const metadata: Metadata = {
  title: "FakeShield AI — Spot the scam before it costs you",
  description:
    "Paste a suspicious message, email or link. FakeShield AI explains every warning sign, scores the risk and tells you what to do next. Risk guidance, not a security verdict.",
};

export default function HomePage() {
  return <HeroLanding />;
}
