"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const THREATS = [
  { label: "OTP Phishing",        pct: 92, color: "#ef4444", sev: "CRITICAL" },
  { label: "Fake Bank KYC",       pct: 88, color: "#f97316", sev: "HIGH"     },
  { label: "Delivery Fee Scam",   pct: 74, color: "#f59e0b", sev: "HIGH"     },
  { label: "Investment Fraud",    pct: 68, color: "#f59e0b", sev: "MEDIUM"   },
  { label: "Job Offer Scam",      pct: 55, color: "#f59e0b", sev: "MEDIUM"   },
];

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#f87171",
  HIGH:     "#fb923c",
  MEDIUM:   "#fbbf24",
};

export function ThreatMeter() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="space-y-3">
      {THREATS.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12.5px] font-semibold text-stone-300">{t.label}</span>
            <div className="flex items-center gap-2">
              <span
                className="text-[8px] font-black tracking-widest uppercase rounded-sm px-1.5 py-0.5"
                style={{
                  color: SEV_COLORS[t.sev],
                  background: `${SEV_COLORS[t.sev]}18`,
                  border: `1px solid ${SEV_COLORS[t.sev]}40`,
                }}
              >
                {t.sev}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-stone-400">{t.pct}%</span>
            </div>
          </div>

          {/* Track */}
          <div
            className="relative h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {/* Animated fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${t.color}90, ${t.color})` }}
              initial={{ width: "0%" }}
              animate={inView ? { width: `${t.pct}%` } : { width: "0%" }}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Shimmer */}
            <motion.div
              className="absolute inset-y-0 w-8 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)" }}
              initial={{ left: "-10%" }}
              animate={inView ? { left: ["0%", `${t.pct - 5}%`] } : {}}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
