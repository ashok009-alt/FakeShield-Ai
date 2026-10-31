import { cn } from "@/lib/utils";

/** Small HUD brackets on the corners of instrument-style panels. */
export function HudCorners({ className }: { className?: string }) {
  return (
    <span
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      <span className="hud-corner left-1.5 top-1.5 rounded-tl-[2px] border-l border-t" />
      <span className="hud-corner right-1.5 top-1.5 rounded-tr-[2px] border-r border-t" />
      <span className="hud-corner bottom-1.5 left-1.5 rounded-bl-[2px] border-b border-l" />
      <span className="hud-corner bottom-1.5 right-1.5 rounded-br-[2px] border-b border-r" />
    </span>
  );
}
