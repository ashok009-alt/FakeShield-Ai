import { stateHeat } from "@/lib/data/trends";
import { cn } from "@/lib/utils";

const HEAT_STYLES = [
  "bg-orange-500/[0.06] border-orange-500/10 text-stone-400",
  "bg-orange-500/[0.12] border-orange-500/15 text-stone-300",
  "bg-orange-500/20 border-orange-500/25 text-orange-100",
  "bg-orange-500/30 border-orange-500/35 text-orange-50",
  "bg-orange-500/45 border-orange-400/50 text-white",
];

/**
 * Text-only fallback for the heatmap. Used when WebGL is unavailable or the
 * map fails to initialise, so the data is never hidden behind a broken widget.
 */
export function StateHeatTiles({ compact = false }: { compact?: boolean }) {
  const maxHeat = Math.max(...stateHeat.map((item) => item.reports));
  return (
    <div>
      <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {stateHeat.map((state) => (
          <div
            key={state.state}
            className={cn(
              "rounded-lg border px-2.5 py-2 transition-colors",
              HEAT_STYLES[state.intensity - 1]
            )}
            title={`${state.state}: ${state.reports.toLocaleString("en-IN")} reports`}
          >
            <p className="truncate text-[10px] font-medium leading-4">{state.state}</p>
            <p className="text-[10px] font-semibold tabular-nums opacity-80">
              {state.reports.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[9.5px] text-stone-500">
          <span>Fewer reports</span>
          <span>More reports</span>
        </div>
        <div className="mt-1 flex h-2 overflow-hidden rounded-full">
          {HEAT_STYLES.map((style) => (
            <span key={style} className={cn("flex-1 border-r border-black/30 last:border-0", style)} />
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-4 text-stone-600">
          Relative intensity by state, not a geographic map.{" "}
          {maxHeat.toLocaleString("en-IN")} is the highest state total.
        </p>
      </div>
    </div>
  );
}
