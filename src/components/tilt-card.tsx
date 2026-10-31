"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  strength?: number;         // how much to tilt (degrees), default 12
  glare?: boolean;           // show glare overlay
  depth?: boolean;           // translate Z on hover
}

/**
 * Pointer-reactive tilt card.
 *
 * - Disabled entirely for touch/coarse pointers and `prefers-reduced-motion`.
 * - Pointer updates are coalesced to one motion write per animation frame, so a
 *   fast mouse cannot flood four springs with dozens of updates per frame.
 * - Glare is a translated layer instead of a rebuilt gradient string per frame.
 */
export function TiltCard({
  children,
  className = "",
  style,
  strength = 12,
  glare = true,
  depth = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const enabledRef = useRef(false);
  const frameRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const rotateY = useSpring(rawY, { stiffness: 180, damping: 22 });
  const scale = useSpring(1, { stiffness: 180, damping: 22 });
  const z = useSpring(0, { stiffness: 180, damping: 22 });

  // Glare: slides a soft light blob toward the pointer.
  const glareX = useTransform(rawY, [-strength, strength], ["-16%", "16%"]);
  const glareY = useTransform(rawX, [-strength, strength], ["16%", "-16%"]);
  const glareOpacity = useSpring(0, { stiffness: 180, damping: 22 });

  useEffect(() => {
    enabledRef.current =
      !reduce &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, [reduce]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!enabledRef.current || event.pointerType !== "mouse") return;
    pointRef.current = { x: event.clientX, y: event.clientY };
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (pointRef.current.x - rect.left) / rect.width;
      const py = (pointRef.current.y - rect.top) / rect.height;
      rawX.set((py - 0.5) * -strength * 2);
      rawY.set((px - 0.5) * strength * 2);
      scale.set(depth ? 1.02 : 1);
      z.set(depth ? 16 : 0);
      glareOpacity.set(glare ? 0.14 : 0);
    });
  }

  function onPointerLeave() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    rawX.set(0);
    rawY.set(0);
    scale.set(1);
    z.set(0);
    glareOpacity.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        z,
        transformStyle: "preserve-3d",
        perspective: 1200,
        ...style,
      }}
      className={className}
    >
      {children}

      {/* Glare overlay */}
      {glare ? (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          style={{ opacity: glareOpacity, mixBlendMode: "screen" }}
        >
          <motion.div
            className="absolute inset-[-40%]"
            style={{
              x: glareX,
              y: glareY,
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 32%, transparent 62%)",
            }}
          />
        </motion.div>
      ) : null}
    </motion.div>
  );
}
