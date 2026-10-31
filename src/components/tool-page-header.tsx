import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  badge,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
          <Icon className="size-[18px] text-orange-300" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
          {eyebrow}
        </span>
        {badge}
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
