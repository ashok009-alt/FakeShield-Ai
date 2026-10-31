"use client";

import { motion } from "framer-motion";
import { RISK_META } from "@/lib/constants";
import type { RiskLevel } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

// Maps risk level to gradient stop colours
const LEVEL_COLORS: Record<RiskLevel, { stroke: string; glow: string; text: string }> = {
  Low: { stroke: "#22c55e", glow: "rgba(34,197,94,0.4)", text: "#4ade80" },
  Medium: { stroke: "#f59e0b", glow: "rgba(245,158,11,0.4)", text: "#fbbf24" },
  High: { stroke: "#f97316", glow: "rgba(249,115,22,0.4)", text: "#fb923c" },
  Critical: { stroke: "#ef4444", glow: "rgba(239,68,68,0.4)", text: "#f87171" },
};

export function ScoreRing({
  score,
  level,
  size = 148,
  className,
}: {
  score: number;
  level: RiskLevel;
  size?: number;
  className?: string;
}) {
  const stroke = 9;
  const radius = (size - stroke * 2 - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clampedScore / 100);
  const colors = LEVEL_COLORS[level];
  const gradId = `score-grad-${level}`;
  const filterId = `score-glow-${level}`;

  return (
    <motion.div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Risk score ${score} out of 100, ${level}`}
      initial={{ rotateY: -25, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.5" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="1" />
          </linearGradient>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />

        {/* Glow duplicate (blur layer) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={stroke + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `blur(6px)`, opacity: 0.35 }}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="tabular-nums font-bold tracking-tight"
          style={{
            fontSize: size > 100 ? "2.25rem" : "1.5rem",
            lineHeight: 1,
            color: colors.text,
            textShadow: `0 0 20px ${colors.glow}`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {score}
        </motion.span>
        {size >= 110 ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
            / 100
          </span>
        ) : null}
        <span
          className={cn(
            "mt-1 font-black uppercase tracking-[0.14em]",
            size >= 110 ? "text-[8.5px]" : "text-[7px]"
          )}
          style={{ color: colors.text }}
        >
          {level.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
}
