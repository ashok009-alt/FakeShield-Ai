import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { QuizRunner } from "@/components/quiz-runner";

export const metadata: Metadata = {
  title: "Scam safety quiz",
  description:
    "Ten scenario questions on OTP fraud, lookalike domains, UPI requests and phishing. Explanations after every answer.",
};

export default function QuizPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
            Safety quiz
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Would you fall for it?
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Real scenarios, no trick wording. Each answer comes with a short explanation so the
            lesson sticks — whether you get it right or not.
          </p>
        </div>
        <Link
          href="/learn"
          className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-lg border border-border bg-white/[0.035] px-4 text-sm font-medium text-foreground transition-colors hover:border-stone-600 hover:bg-white/[0.065] sm:self-auto"
        >
          <BookOpen className="size-4" />
          Read the guides first
        </Link>
      </div>

      <div className="mt-8 max-w-3xl">
        <QuizRunner />
      </div>
    </div>
  );
}
