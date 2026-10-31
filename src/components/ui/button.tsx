"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-95 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-orange-400 to-orange-600 text-[#180a02] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-110 hover:-translate-y-px",
        secondary:
          "border border-[#4a3422] bg-[#171009] text-white hover:border-stone-500 hover:bg-[#1d130a]",
        outline:
          "border border-[#3a2a1c] bg-transparent text-white hover:bg-white/[0.04]",
        ghost: "text-stone-400 hover:bg-white/[0.05] hover:text-white",
        destructive:
          "border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/15",
        link: "text-orange-300 underline-offset-4 hover:underline hover:text-orange-200",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
