import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

export function AnalyzerEmptyState({
  icon: Icon,
  title,
  description,
  steps,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <div className="surface flex min-h-[320px] flex-col justify-center rounded-2xl p-6 sm:p-8">
      <div className="grid size-11 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07]">
        <Icon className="size-5 text-orange-300" />
      </div>
      <h2 className="mt-5 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <ol className="mt-5 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-[13px] leading-6 text-stone-300">
            <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-border bg-white/[0.03] text-[9px] font-semibold text-stone-400">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-start gap-2 border-t border-border/60 pt-4 text-[11px] leading-5 text-stone-500">
        <Info className="mt-0.5 size-3 shrink-0" />
        Results are guidance, not a verdict. The engine explains what it found and how confident
        it is.
      </p>
    </div>
  );
}
