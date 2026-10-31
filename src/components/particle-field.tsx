"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  alphaDir: number;
  color: string;
}

const COLORS = [
  "#f97316", // ember-500
  "#fb923c", // ember-400
  "#fdba74", // ember-300
  "#7c3d12", // deep umber
  "#fbbf24", // gold
];

const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 30; // 30fps is plenty for ambient dust

/**
 * Ambient drifting particles with subtle link lines.
 *
 * Performance notes:
 * - Stops the animation loop when offscreen, on a hidden tab, or reduced motion.
 * - Caps device pixel ratio at 2 so 3x phones do not render 9x the pixels.
 * - Draws at ~30fps with delta-time movement, so speed is display-independent.
 * - Uses flat alpha circles instead of per-particle gradients (no per-frame
 *   gradient allocation), and batches all link lines into a single path.
 */
export function ParticleField({
  count = 55,
  maxSpeed = 0.25,
  connectDistance = 120,
  className = "",
}: {
  count?: number;
  maxSpeed?: number;
  connectDistance?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d", { alpha: true });
    if (!context) return;
    // Explicit non-null aliases keep narrowing inside the nested frame functions.
    const surface: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let linkDistance = connectDistance;
    let raf = 0;
    let last = 0;
    let running = false;
    let inView = true;
    let pageVisible = !document.hidden;

    function resize() {
      const rect = surface.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      // Reset before scaling, otherwise repeated resizes compound the transform.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      const compact = width < 640;
      const total = compact ? Math.min(count, 26) : count;
      linkDistance = compact ? Math.min(connectDistance, 96) : connectDistance;

      particles = Array.from({ length: total }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * maxSpeed * 2,
        vy: (Math.random() - 0.5) * maxSpeed * 2,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        alphaDir: Math.random() > 0.5 ? 0.003 : -0.003,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // One path, one stroke: much cheaper than stroking every pair separately.
      ctx.beginPath();
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy < linkDistance * linkDistance) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
      }
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(249,115,22,0.11)";
      ctx.stroke();

      // Soft halo (flat fill, no gradient allocation).
      for (const p of particles) {
        ctx.globalAlpha = p.alpha * 0.16;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.4, 0, TAU);
        ctx.fill();
      }

      // Bright core.
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function update(scale: number) {
      for (const p of particles) {
        p.x += p.vx * scale;
        p.y += p.vy * scale;
        p.alpha += p.alphaDir * scale;
        if (p.alpha > 0.75 || p.alpha < 0.1) p.alphaDir *= -1;
        if (p.x < 0) p.x += width;
        if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        if (p.y > height) p.y -= height;
      }
    }

    function frame(ts: number) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (ts - last < FRAME_MS) return;
      const scale = last ? Math.min((ts - last) / (1000 / 60), 3) : 1;
      last = ts;
      update(scale);
      draw();
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function sync() {
      if (motionQuery.matches) {
        stop();
        draw();
        return;
      }
      if (inView && pageVisible) start();
      else stop();
    }

    function onVisibility() {
      pageVisible = !document.hidden;
      sync();
    }

    resize();
    init();
    sync();

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? false;
        sync();
      },
      { rootMargin: "120px" }
    );
    observer.observe(surface);

    const ro = new ResizeObserver(() => {
      resize();
      init();
      if (!running) draw();
    });
    ro.observe(surface);

    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", sync);

    return () => {
      stop();
      observer.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", sync);
    };
  }, [count, maxSpeed, connectDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
