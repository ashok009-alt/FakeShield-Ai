"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatsResponse } from "@/lib/serialize";
import { RISK_META } from "@/lib/constants";

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ea580c",
  Critical: "#ef4444",
};

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 12,
  fontSize: 12,
  color: "#f8fafc",
  boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
} as const;

export function ScanVolumeChart({ stats }: { stats: StatsResponse }) {
  const data = stats.daily.map((day) => ({ ...day, scans: day.count }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#173d37" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8fa39a", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8fa39a", fontSize: 11 }}
            width={34}
          />
          <Tooltip
            cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#94a3b8", fontSize: 11 }}
            formatter={(value: number) => [`${value} scans`, ""]}
            labelFormatter={(label) => `Day: ${label}`}
          />
          <Bar dataKey="scans" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskMixChart({ stats }: { stats: StatsResponse }) {
  const data = (["Low", "Medium", "High", "Critical"] as const)
    .map((level) => ({ name: level, value: stats.byLevel[level] }))
    .filter((item) => item.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="grid h-56 place-items-center text-xs text-stone-500">
        Run an analysis to see the risk mix.
      </div>
    );
  }

  return (
    <div className="grid h-56 grid-cols-[1fr_auto] items-center gap-2">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="#071f1d"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [`${value} scans`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 pr-1">
        {(["Low", "Medium", "High", "Critical"] as const).map((level) => (
          <li key={level} className="flex items-center gap-2 text-[11px] text-stone-400">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: RISK_COLORS[level] }}
            />
            <span className="w-14">{RISK_META[level].label.replace(" risk", "")}</span>
            <span className="tabular-nums text-stone-300">{stats.byLevel[level]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
