import type { Metadata } from "next";
import Link from "next/link";
import { ScanText } from "lucide-react";
import { HistoryDashboard } from "@/components/history-dashboard";

export const metadata: Metadata = {
  title: "Analysis history",
  description:
    "Review saved message, email and link analyses, filter by risk, and see simple analytics for this browser session.",
};

export default function HistoryPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
            History & dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you have checked.
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Saved reports, risk trends and the signals that keep appearing. History is scoped to this
            browser&apos;s anonymous session.
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-300 sm:self-auto"
        >
          <ScanText className="size-4" />
          New analysis
        </Link>
      </div>

      <div className="mt-8">
        <HistoryDashboard />
      </div>
    </div>
  );
}
