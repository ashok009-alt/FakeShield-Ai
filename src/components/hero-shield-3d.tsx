"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Animated floating particles
const PARTICLES = [
  { x: 20,  y: 15,  size: 2,   delay: 0,    color: "#f97316", dur: 4  },
  { x: 80,  y: 10,  size: 1.5, delay: 0.8,  color: "#fb923c", dur: 5  },
  { x: 90,  y: 50,  size: 2.5, delay: 1.5,  color: "#f97316", dur: 3.5},
  { x: 75,  y: 85,  size: 1.5, delay: 0.4,  color: "#fdba74", dur: 6  },
  { x: 15,  y: 75,  size: 2,   delay: 1.2,  color: "#fb923c", dur: 4.5},
  { x: 10,  y: 40,  size: 1,   delay: 2,    color: "#f97316", dur: 7  },
  { x: 50,  y: 5,   size: 1.5, delay: 0.6,  color: "#fb923c", dur: 5.5},
  { x: 95,  y: 30,  size: 1,   delay: 1.8,  color: "#fb923c", dur: 4.8},
];

// Network nodes for the threat-network diagram
const NODES = [
  { cx: 160, cy: 160, r: 6,  label: "Core",     color: "#f97316" },
  { cx: 80,  cy: 80,  r: 4,  label: "Phishing",  color: "#f87171" },
  { cx: 240, cy: 80,  r: 4,  label: "OTP Fraud", color: "#fb923c" },
  { cx: 80,  cy: 240, r: 4,  label: "KYC Scam",  color: "#fbbf24" },
  { cx: 240, cy: 240, r: 4,  label: "Malware",   color: "#f87171" },
  { cx: 160, cy: 50,  r: 3,  label: "URL",       color: "#fbbf24" },
  { cx: 50,  cy: 160, r: 3,  label: "Email",     color: "#34d399" },
  { cx: 270, cy: 160, r: 3,  label: "SMS",       color: "#fb923c" },
  { cx: 160, cy: 270, r: 3,  label: "Social",    color: "#f59e0b" },
];

const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
  [1,5],[2,5],[3,6],[4,8],[1,2],[3,4],
];

const LABELS = [
  { label: "PHISHING", color: "#f87171", tint: "rgba(239,68,68" },
  { label: "OTP FRAUD", color: "#fb923c", tint: "rgba(249,115,22" },
  { label: "MALWARE", color: "#fbbf24", tint: "rgba(245,158,11" },
  { label: "SPOOFING", color: "#fbbf24", tint: "rgba(180,83,9" },
];

/**
 * Decorative 3D threat-network hero graphic.
 *
 * Continuous loops (particles, packets, pulses, bobbing cards) are only mounted
 * while the graphic is on screen and the tab is visible — offscreen it settles
 * into a static diagram with zero animation frames. Pointer tilt runs on a
 * fine pointer only and is throttled to one motion update per frame.
 */
export function HeroShield3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);
  const inViewRef = useRef(inView);

  const rotX = useSpring(0, { stiffness: 100, damping: 20 });
  const rotY = useSpring(0, { stiffness: 100, damping: 20 });

  const active = inView && !reduce && visible;

  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  // Track on-screen state with an IntersectionObserver plus a scroll/resize
  // rect check. The fallback keeps pause/resume reliable in browsers that
  // defer or batch IntersectionObserver notifications (background tabs,
  // embedded webviews), where scrolling back into view must still resume.
  // Scroll callbacks read one cached rect and only re-render on a boundary
  // crossing, so the cost during scrolling is negligible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let current = true;

    const setView = (next: boolean) => {
      if (next === current) return;
      current = next;
      setInView(next);
    };

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 0;
      setView(rect.bottom > -240 && rect.top < viewport + 240);
    };

    measure();

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (entry) setView(entry.isIntersecting);
        },
        { rootMargin: "240px" },
      );
      observer.observe(el);
    }

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (px - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (py - (rect.top + rect.height / 2)) / (rect.height / 2);
      rotX.set(Math.max(-1, Math.min(1, -dy)) * 10);
      rotY.set(Math.max(-1, Math.min(1, dx)) * 10);
    };

    const onMove = (event: PointerEvent) => {
      if (!inViewRef.current) return;
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
  }, [rotX, rotY]);

  return (
    <div
      ref={containerRef}
      className={`relative flex w-full select-none items-center justify-center ${active ? "" : "motion-paused"}`}
      style={{ height: 360 }}
      aria-hidden="true"
    >
      {/* Floating particles — mounted only while animating */}
      {active
        ? PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size * 4,
                height: p.size * 4,
                background: p.color,
                boxShadow: `0 0 ${p.size * 6}px ${p.color}`,
              }}
              animate={{
                y: [-8, 8, -8],
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))
        : null}

      {/* Radar sweep behind the graph */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[430px] -translate-x-1/2 -translate-y-1/2">
        <div className="radar-sweep size-full opacity-80" />
      </div>

      {/* Main 3D panel */}
      <motion.div
        className="relative"
        style={{
          rotateX: rotX,
          rotateY: rotY,
          transformStyle: "preserve-3d",
          perspective: 1200,
        }}
      >
        {/* Outer glow ring 1 */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 320, height: 320,
            top: "50%", left: "50%",
            x: "-50%", y: "-50%",
            border: "1px solid rgba(249,115,22,0.15)",
          }}
          animate={active ? { scale: [1, 1.08, 1], opacity: [0.3, 0.15, 0.3] } : { scale: 1, opacity: 0.25 }}
          transition={active ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        />
        {/* Outer glow ring 2 */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 380, height: 380,
            top: "50%", left: "50%",
            x: "-50%", y: "-50%",
            border: "1px solid rgba(249,115,22,0.07)",
          }}
          animate={active ? { scale: [1, 1.05, 1], opacity: [0.15, 0.07, 0.15] } : { scale: 1, opacity: 0.12 }}
          transition={active ? { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 } : { duration: 0.4 }}
        />

        {/* Network SVG threat diagram */}
        <motion.div
          className="absolute overflow-hidden rounded-full"
          style={{
            width: 320, height: 320,
            top: "50%", left: "50%",
            x: "-50%", y: "-50%",
            background: "radial-gradient(ellipse, rgba(26,18,11,0.9) 60%, rgba(11,7,4,0.95) 100%)",
            border: "1px solid rgba(249,115,22,0.12)",
            boxShadow: "0 0 60px -10px rgba(249,115,22,0.2), inset 0 0 40px rgba(0,0,0,0.5)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg width="320" height="320" viewBox="0 0 320 320">
            {/* Edges */}
            {EDGES.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={NODES[a].cx} y1={NODES[a].cy}
                x2={NODES[b].cx} y2={NODES[b].cy}
                stroke="rgba(249,115,22,0.18)"
                strokeWidth="0.8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.06, ease: "easeOut" }}
              />
            ))}

            {/* Animated data packets along edges */}
            {active
              ? EDGES.slice(0, 6).map(([a, b], i) => (
                  <motion.circle
                    key={`pkt-${i}`}
                    r={1.5}
                    fill="#fb923c"
                    opacity={0.7}
                    initial={{ cx: NODES[a].cx, cy: NODES[a].cy }}
                    animate={{
                      cx: [NODES[a].cx, NODES[b].cx, NODES[a].cx],
                      cy: [NODES[a].cy, NODES[b].cy, NODES[a].cy],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      delay: i * 0.4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))
              : null}

            {/* Nodes */}
            {NODES.map((node, i) => (
              <g key={i}>
                {active ? (
                  <motion.circle
                    cx={node.cx} cy={node.cy} r={node.r + 6}
                    fill={node.color}
                    opacity={0}
                    initial={{ opacity: 0, r: node.r + 3 }}
                    animate={{ opacity: [0, 0.15, 0], r: [node.r + 3, node.r + 10] }}
                    transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
                  />
                ) : null}
                <motion.circle
                  cx={node.cx} cy={node.cy}
                  r={node.r}
                  fill={node.color}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: `drop-shadow(0 0 ${node.r * 2}px ${node.color})` }}
                />
              </g>
            ))}

            {/* Centre shield icon */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "160px 160px" }}
            >
              <path
                d="M160 138 L174 143.2V152c0 8.3-5.8 15.3-14 18.4C151.8 167.3 146 160.3 146 152V143.2Z"
                fill="rgba(249,115,22,0.25)"
                stroke="#f97316"
                strokeWidth="1.2"
              />
              <path
                d="M155.5 157l4 4 8-8.5"
                fill="none"
                stroke="#fb923c"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>

            {/* Scan sweep */}
            {active ? (
              <motion.line
                x1="0" y1="0"
                x2="0" y2="320"
                stroke="rgba(249,115,22,0.15)"
                strokeWidth="1"
                animate={{ x: [0, 320, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            ) : null}
          </svg>
        </motion.div>

        {/* Orbiting threat labels (CSS rotation; paused when offscreen) */}
        <div
          className="orbit-ring pointer-events-none absolute"
          style={{ width: 340, height: 340, top: "50%", left: "50%", marginLeft: -170, marginTop: -170 }}
        >
          {LABELS.map((item, i) => {
            const angle = (i / 4) * Math.PI * 2;
            const x = 170 + 160 * Math.cos(angle) - 30;
            const y = 170 + 160 * Math.sin(angle) - 8;
            return (
              <div
                key={item.label}
                className="absolute text-[8px] font-black uppercase tracking-widest"
                style={{
                  left: x,
                  top: y,
                  color: item.color,
                  background: `${item.tint},0.08)`,
                  border: `1px solid ${item.tint},0.25)`,
                  padding: "2px 5px",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  opacity: 0.75,
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Translucent depth layer cards */}
        <motion.div
          className="pointer-events-none absolute rounded-sm"
          style={{
            width: 120, height: 50,
            top: 20, right: -30,
            background: "rgba(26,18,11,0.85)",
            border: "1px solid rgba(249,115,22,0.2)",
            translateZ: 30,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
          animate={active ? { y: [-4, 4, -4] } : { y: 0 }}
          transition={active ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        >
          <div className="px-3 py-2">
            <div className="text-[8px] font-bold uppercase tracking-widest text-amber-500">Signal rules</div>
            <div className="text-[18px] font-black leading-tight text-white">87</div>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute rounded-sm"
          style={{
            width: 130, height: 50,
            bottom: 20, left: -35,
            background: "rgba(26,18,11,0.85)",
            border: "1px solid rgba(245,158,11,0.2)",
            translateZ: 25,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
          animate={active ? { y: [4, -4, 4] } : { y: 0 }}
          transition={active ? { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } : { duration: 0.4 }}
        >
          <div className="px-3 py-2">
            <div className="text-[8px] font-bold uppercase tracking-widest text-amber-500">Scam patterns</div>
            <div className="text-[18px] font-black leading-tight text-white">15</div>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute rounded-sm"
          style={{
            width: 110, height: 44,
            top: "50%", right: -40,
            marginTop: -22,
            background: "rgba(26,18,11,0.85)",
            border: "1px solid rgba(34,197,94,0.2)",
            translateZ: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
          animate={active ? { y: [-6, 6, -6] } : { y: 0 }}
          transition={active ? { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 } : { duration: 0.4 }}
        >
          <div className="px-3 py-2">
            <div className="text-[8px] font-bold uppercase tracking-widest text-emerald-500">Scan time</div>
            <div className="text-[18px] font-black leading-tight text-white">&lt; 2s</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
