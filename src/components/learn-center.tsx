"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { DataIcon } from "@/components/icon-map";
import { learnCategories, learnGuides, type LearnGuide } from "@/lib/data/learn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function LearnCenter() {
  const [category, setCategory] = useState("all");
  const [active, setActive] = useState<LearnGuide | null>(null);

  const filtered = useMemo(
    () => (category === "all" ? learnGuides : learnGuides.filter((g) => g.category === category)),
    [category]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["all", ...learnCategories].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              category === item
                ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                : "border-border bg-white/[0.02] text-stone-400 hover:border-stone-600 hover:text-stone-200"
            )}
          >
            {item === "all" ? "All topics" : item}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((guide) => (
          <button
            key={guide.id}
            type="button"
            onClick={() => setActive(guide)}
            className="surface group flex h-full flex-col rounded-2xl p-5 text-left transition-colors hover:border-orange-500/35 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07] text-orange-300">
                <DataIcon name={guide.icon} className="size-5" />
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                <Clock className="size-3" />
                {guide.readTime}
              </span>
            </div>
            <h2 className="mt-4 text-[15px] font-semibold leading-6 tracking-tight text-foreground">
              {guide.title}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-6 text-stone-400">
              {guide.summary}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-300">
              Read guide
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300/80">
                    {active.category}
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                    <Clock className="size-3" />
                    {active.readTime} read
                  </span>
                </div>
                <DialogTitle className="mt-1 text-xl leading-7">{active.title}</DialogTitle>
                <DialogDescription>{active.summary}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {active.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-stone-300">{section.body}</p>
                    {section.steps ? (
                      <ul className="mt-2.5 space-y-1.5 rounded-xl border border-border/70 bg-black/20 p-3.5">
                        {section.steps.map((step) => (
                          <li
                            key={step}
                            className="flex gap-2 text-[12.5px] leading-5 text-stone-300"
                          >
                            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-orange-400/80" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-stone-500">
                  Guidance, not legal or financial advice. When money is at risk, contact your bank
                  directly.
                </p>
                <div className="flex gap-2">
                  {active.relatedPattern ? (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href="/patterns">Related pattern</Link>
                    </Button>
                  ) : null}
                  <Button size="sm" asChild>
                    <Link href="/quiz">Test yourself</Link>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
