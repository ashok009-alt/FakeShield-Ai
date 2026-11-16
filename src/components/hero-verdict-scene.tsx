"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { HudCorners } from "@/components/hud-corners";
import { ScoreRing } from "@/components/score-ring";

const PREVIEW_SIGNALS = [
  "OTP or verification-code request",
  "Brand-lookalike domain",
  "Account suspension threat",
];

/**
 * Hero 3D verdict scene.
 *
 * A stacked, perspective composition rather than a flat card: a tilted glass
 * console floats over two depth plates and two orbital rings, with signal
 * chips lifted on their own Z planes. Pointer tilt is clamped to a few degrees
 * so type stays readable, runs on one rAF write per frame, and is disabled for
 * touch and reduced-motion visitors.
 */
export function HeroVerdictScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rotX = useSpring(0, { stiffness: 90, damping: 18 });
  const rotY = useSpring(0, { stiffness: 90, damping: 18 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (px - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (py - (rect.top + rect.height / 2)) / (rect.height / 2);
      rotX.set(Math.max(-1, Math.min(1, -dy)) * 4.5);
      rotY.set(Math.max(-1, Math.min(1, dx)) * 6);
    };

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      rotX.set(0);
      rotY.set(0);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce, rotX, rotY]);

  return (
    <div ref={ref} className="hero-3d-scene">
      <div className="hero-3d-halo" aria-hidden="true" />
      <div className="hero-3d-ring hero-3d-ring--a" aria-hidden="true" />
      <div className="hero-3d-ring hero-3d-ring--b" aria-hidden="true" />
      <div className="hero-3d-spark hero-3d-spark--a" aria-hidden="true" />
      <div className="hero-3d-spark hero-3d-spark--b" aria-hidden="true" />
      <div className="hero-3d-spark hero-3d-spark--c" aria-hidden="true" />

      <motion.div className="hero-3d-tilt" style={{ rotateX: rotX, rotateY: rotY }}>
        <div className="hero-3d-stage">
          <div className="hero-3d-plate hero-3d-plate--back" aria-hidden="true" />
          <div className="hero-3d-plate hero-3d-plate--mid" aria-hidden="true" />
          <div className="hero-3d-floor-shadow" aria-hidden="true" />

          <div className="hero-3d-card">
            <HudCorners />
            <span className="hero-3d-edge" aria-hidden="true" />
            <span className="hero-3d-scan" aria-hidden="true" />

            <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                <span className="live-dot" />
                Live triage
              </span>
              <span className="rounded-sm border border-white/10 bg-black/25 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                Sample
              </span>
            </div>

            <p className="mt-3 rounded-lg border border-white/[0.06] bg-black/35 p-3 font-mono text-[10.5px] leading-5 text-white/55">
              “Dear Customer, your SBI account will be blocked today. Update KYC and share the
              OTP…”
            </p>

            <div className="relative mt-4 flex items-center gap-4">
              <ScoreRing score={100} level="Critical" size={108} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between text-[9.5px] uppercase tracking-wider text-white/40">
                  <span>Confidence</span>
                  <span className="font-bold tabular-nums text-white/80">95%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-amber-400 to-red-400" />
                </div>
                <div className="flex items-center justify-between text-[9.5px] uppercase tracking-wider text-white/40">
                  <span>Signals</span>
                  <span className="font-bold tabular-nums text-white/80">9 found</span>
                </div>
                <ul className="space-y-1 pt-0.5">
                  {PREVIEW_SIGNALS.map((signal) => (
                    <li key={signal} className="flex items-center gap-1.5 text-[10.5px] text-white/65">
                      <span className="size-1 shrink-0 rounded-full bg-red-400" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-[8.5px] uppercase tracking-[0.16em] text-white/35">
                Links never fetched
              </span>
              <Link
                href="/analyze?sample=kyc-block"
                className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-orange-300 transition-colors hover:text-orange-200"
              >
                Open this analysis
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          <div className="hero-3d-chip hero-3d-chip--otp" aria-hidden="true">
            <span className="hero-3d-float">
              <span className="hero-3d-chip-dot bg-red-400" />
              OTP requested
              <span className="hero-3d-chip-meta">credential</span>
            </span>
          </div>

          <div className="hero-3d-chip hero-3d-chip--domain" aria-hidden="true">
            <span className="hero-3d-float">
              <span className="hero-3d-chip-dot bg-amber-300" />
              Lookalike domain
              <span className="hero-3d-chip-meta">sbi-kyc…xyz</span>
            </span>
          </div>

          <div className="hero-3d-chip hero-3d-chip--scan" aria-hidden="true">
            <span className="hero-3d-float">
              <span className="hero-3d-chip-dot bg-emerald-400" />
              Sandbox scan
              <span className="hero-3d-chip-meta">&lt; 2s</span>
            </span>
          </div>
        </div>
      </motion.div>

      <p className="hero-3d-caption">Illustrative sample · not live traffic</p>
    </div>
  );
}
