import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, ListChecks } from "lucide-react";
import { LearnCenter } from "@/components/learn-center";
import { learnGuides } from "@/lib/data/learn";
import { quizQuestions } from "@/lib/data/quiz";

export const metadata: Metadata = {
  title: "Cybersecurity learning center",
  description:
    "Beginner-friendly guides on phishing, link safety, OTPs, sender verification, account recovery, safe payments and reporting cyber fraud in India.",
};

export default function LearnPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
          Learning center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The skills that make scams harder.
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          Short, practical guides — no jargon. Each one ends with specific steps you can take the
          next time a message, link or payment request feels wrong.
        </p>
      </div>

      <div className="mt-8">
        <LearnCenter />
      </div>

      <section className="surface mt-8 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Ready to test yourself?</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-6 text-stone-400">
              {quizQuestions.length} scenario questions on OTPs, domains, UPI requests and phishing.
              Your score updates as you go, with an explanation after every answer.
            </p>
          </div>
        </div>
        <Link
          href="/quiz"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-300"
        >
          <ListChecks className="size-4" />
          Start the quiz
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        {learnGuides.length} guides reviewed for clarity and accuracy. Nothing here is a substitute
        for advice from your bank, a lawyer or law enforcement when money or identity documents are
        involved.
      </p>
    </div>
  );
}
