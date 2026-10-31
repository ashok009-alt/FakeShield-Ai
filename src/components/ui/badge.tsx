import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "border-orange-500/25 bg-orange-500/10 text-orange-300",
        neutral: "border-white/[0.08] bg-white/[0.04] text-stone-300",
        success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
        danger: "border-red-500/25 bg-red-500/10 text-red-300",
        outline: "border-white/[0.06] text-stone-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
