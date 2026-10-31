import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ScanText } from "lucide-react";
import { PatternLibrary } from "@/components/pattern-library";
import { scamPatterns } from "@/lib/data/patterns";

export const metadata: Metadata = {
  title: "Scam pattern library",
  description:
    "A searchable library of real scam patterns — fake KYC, OTP fraud, UPI collect requests, fake jobs, investment scams and more — with warning signs and protection steps.",
};

export default function PatternsPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
            Scam patterns
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Learn the plays before they reach you.
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {scamPatterns.length} documented patterns, each with the warning signs, the example
            message, what the scammer is after, and what to do instead. Every pattern can be run
            through the analyzer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/learn"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white/[0.035] px-4 text-sm font-medium text-foreground transition-colors hover:border-stone-600 hover:bg-white/[0.065]"
          >
            <BookOpen className="size-4" />
            Learning center
          </Link>
          <Link
            href="/analyze"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-300"
          >
            <ScanText className="size-4" />
            Analyze a message
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <PatternLibrary />
      </div>
    </div>
  );
}
