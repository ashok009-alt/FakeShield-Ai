"use client";

import { useEffect, useState } from "react";
import { Sun, SunDim } from "lucide-react";
import { cn } from "@/lib/utils";

export const BRIGHT_STORAGE_KEY = "fakeshield.bright.v1";

/**
 * Display brightness control.
 *
 * The site ships in a dark ember theme, so this is a luminance toggle rather
 * than a full light theme: "bright" lifts the whole interface with a GPU
 * brightness filter (and a lighter backdrop). The choice is persisted and
 * applied before hydration by a tiny inline script in the root layout.
 */
export function BrightnessToggle({
  className,
  variant = "site",
}: {
  className?: string;
  variant?: "site" | "hero";
}) {
  const [bright, setBright] = useState(false);

  useEffect(() => {
    setBright(document.documentElement.dataset.bright === "on");
  }, []);

  function toggle() {
    const next = !bright;
    setBright(next);
    document.documentElement.dataset.bright = next ? "on" : "off";
    try {
      localStorage.setItem(BRIGHT_STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* storage can be unavailable in private modes */
    }
  }

  const Icon = bright ? Sun : SunDim;
  const label = bright ? "Dim the interface" : "Brighten the interface";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={bright}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg border transition-colors",
        variant === "hero"
          ? "liquid-glass text-white/80 hover:text-white"
          : "border-[#3a2a1c] bg-[#171009] text-stone-400 hover:border-stone-600 hover:text-white",
        className
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
