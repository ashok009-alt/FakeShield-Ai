"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Flame, MapPin, TrendingUp, Users } from "lucide-react";
import {
  risingAlerts,
  stateHeat,
  trendCategories,
  trendDaily,
  trendSummary,
} from "@/lib/data/trends";
import { IndiaScamMap } from "@/components/india-scam-map";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "#150e08",
  border: "1px solid #342416",
  borderRadius: 10,
  fontSize: 12,
  color: "#eadfd2",
  boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
} as const;

export function TrendsDashboard() {
  const totalCategory = trendCategories.reduce((sum, item) => sum + item.reports, 0);
  const maxCategory = Math.max(...trendCategories.map((item) => item.reports));
  const maxHeat = Math.max(...stateHeat.map((item) => item.reports));
  const topStates = [...stateHeat].sort((a, b) => b.reports - a.reports).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Reports this week"
          value={trendSummary.totalReports.toLocaleString("en-IN")}
          note={`${trendSummary.comparedToLastWeek}% vs last week`}
          tone="orange"
        />
        <Kpi
          icon={TrendingUp}
          label="Critical share"
          value={`${trendSummary.criticalShare}%`}
          note="of all analysed messages"
          tone="red"
        />
        <Kpi
          icon={Flame}
          label="Fastest riser"
          value="OTP theft"
          note="+34% week over week"
          tone="amber"
        />
        <Kpi
          icon={MapPin}
          label="Most reported state"
          value={trendSummary.topState}
          note="1,840 reports"
          tone="orange"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Reports per day</h2>
              <p className="mt-0.5 text-[11px] text-stone-500">{trendSummary.weekLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-orange-400" /> All reports
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-400/80" /> High + critical
              </span>
            </div>
          </div>

          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendDaily} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendAll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="trendHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#2c1f14" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8a7461", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#8a7461", fontSize: 11 }}
                  width={40}
                  tickFormatter={(value: number) =>
                    value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${value}`
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#b8a694", fontSize: 11 }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString("en-IN")} reports`,
                    name === "reports" ? "All reports" : "High + critical",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#fb923c"
                  strokeWidth={2}
                  fill="url(#trendAll)"
                  animationDuration={700}
                />
                <Area
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#f87171"
                  strokeWidth={1.6}
                  fill="url(#trendHigh)"
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-2 text-right text-[10px] text-stone-600">
            Friday peaks at 2,010 reports — a common payday and delivery-notice window.
          </p>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Rising now</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">Largest week-over-week increases</p>
          <ul className="mt-4 space-y-3">
            {risingAlerts.map((alert) => {
              const tone =
                alert.level === "critical"
                  ? "border-red-500/25 bg-red-500/[0.06] text-red-300"
                  : alert.level === "high"
                    ? "border-orange-500/25 bg-orange-500/[0.06] text-orange-300"
                    : "border-amber-500/20 bg-amber-500/[0.05] text-amber-300";
              return (
                <li key={alert.title} className={cn("rounded-xl border px-3.5 py-3", tone)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold">{alert.title}</p>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums">
                      <ArrowUpRight className="size-3" />+{alert.change}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-4 text-stone-400">{alert.detail}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Scam heatmap</h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Where reports come from · state-level concentration
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/[0.07] px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-orange-200">
            <MapPin className="size-2.5" /> MapLibre · India
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
          <IndiaScamMap />

          <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Most reported
              </p>
              <span className="text-[9.5px] text-stone-600">this week</span>
            </div>
            <ol className="mt-3 space-y-2.5">
              {topStates.map((state, index) => (
                <li key={state.state}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 shrink-0 text-[10px] tabular-nums text-stone-600">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-[11px] text-stone-300">{state.state}</span>
                    <span className="text-[10px] font-semibold tabular-nums text-orange-200">
                      {state.reports.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="ml-[22px] mt-1 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
                      style={{ width: `${Math.max(6, (state.reports / maxHeat) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-3 text-[9.5px] leading-4 text-stone-600">
              Hover or tap a state for its report share. {maxHeat.toLocaleString("en-IN")} reports is
              the highest state total.
            </p>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-4 text-stone-600">
          Boundaries are a simplified, bundled GeoJSON file drawn without a third-party tile server.
          Numbers are illustrative demo data, not a live feed.
        </p>
      </div>

      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Scam types</h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              {totalCategory.toLocaleString("en-IN")} categorised reports
            </p>
          </div>
          <span className="text-[10px] text-stone-600">Share of week</span>
        </div>

        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {trendCategories.map((category) => (
            <li key={category.name}>
              <div className="flex items-center justify-between gap-2 text-[11.5px]">
                <span className="text-stone-300">{category.name}</span>
                <span className="flex items-center gap-2 tabular-nums text-stone-500">
                  {category.reports.toLocaleString("en-IN")}
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-medium",
                      category.change >= 0 ? "text-orange-300" : "text-emerald-300"
                    )}
                  >
                    {category.change >= 0 ? (
                      <ArrowUpRight className="size-2.5" />
                    ) : (
                      <ArrowDownRight className="size-2.5" />
                    )}
                    {Math.abs(category.change)}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${Math.max(4, (category.reports / maxCategory) * 100)}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
        <p className="text-[10.5px] leading-5 text-amber-200/80">
          Illustrative trend data for this demo. Figures are modelled to show realistic Indian scam
          patterns; they are not a live feed from cybercrime.gov.in or any telecom operator.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note: string;
  tone: "orange" | "red" | "amber";
}) {
  const styles =
    tone === "red"
      ? "border-red-500/20 bg-red-500/[0.04] text-red-300"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/[0.04] text-amber-300"
        : "border-orange-500/20 bg-orange-500/[0.04] text-orange-300";
  return (
    <div className={cn("rounded-2xl border p-4", styles)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</span>
        <Icon className="size-3.5 opacity-70" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-0.5 text-[10px] opacity-70">{note}</p>
    </div>
  );
}
