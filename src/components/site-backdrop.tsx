"use client";

import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/video-background";

type BackdropProfile = "insight" | "focus" | "learn" | "calm" | "none";

/**
 * Pick the ambient register for the route.
 *
 * - insight — intelligence surfaces (trends, community, history, channels):
 *   the footage stays present, because these pages are about scanning.
 * - focus   — analyzers: the backdrop steps back so forms and verdict cards
 *   carry the contrast.
 * - learn   — guides and quizzes: quieter still, less motion.
 * - calm    — the family checker: a near-static poster for low-end phones.
 * - none    — the landing page paints its own hero, and /offline is standalone.
 */
function profileFor(pathname: string): BackdropProfile {
  if (pathname === "/" || pathname === "/offline") return "none";
  if (pathname.startsWith("/protect")) return "calm";
  if (/^\/(analyze|image|forward|link|email|language|platform)(\/|$)/.test(pathname)) {
    return "focus";
  }
  if (/^\/(learn|quiz|about|404)(\/|$)/.test(pathname)) return "learn";
  return "insight";
}

/**
 * Fixed, site-wide backdrop.
 *
 * Sits behind every route (z-0) while content renders in a z-10 layer. The
 * tone is adaptive rather than fixed:
 *
 * - route profile changes footage opacity, scrim strength, glow and motion;
 * - display brightness ("Brighten the interface") lifts the scrims instead of
 *   applying a blunt brightness filter;
 * - a completed analysis stamps `data-threat` on <html>, so the ember glow
 *   warms slightly for High/Critical results and cools for Low results;
 * - small screens, reduced motion and reduced transparency lower the cost.
 *
 * All of the tuning lives in CSS custom properties (see globals.css), so the
 * layer never re-renders the video element when only the profile changes.
 */
export function SiteBackdrop() {
  const pathname = usePathname();
  const profile = profileFor(pathname);
  if (profile === "none") return null;

  return (
    <div
      className="site-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden"
      data-profile={profile}
      aria-hidden="true"
    >
      <VideoBackground
        opacity="var(--backdrop-video)"
        still={profile === "calm"}
        className="fs-backdrop-video"
      />

      {/* Warm bloom behind the header, mirrored faintly under the footer */}
      <div className="site-backdrop-glow absolute inset-0" />

      {/* Legibility scrim: keeps the ember tone and fades the footage at the edges */}
      <div className="site-backdrop-scrim absolute inset-0" />
      <div className="site-backdrop-vignette absolute inset-0" />
      <div className="site-backdrop-horizon absolute inset-x-0 bottom-0 h-1/3" />

      {/* Risk-aware tint — set by result panels through html[data-threat] */}
      <div className="site-backdrop-ambient absolute inset-0" />

      {/* Engineering grid + grain + slow scan sweep: the console's material */}
      <div className="site-backdrop-grid texture-grid absolute inset-0" />
      <div className="site-backdrop-noise texture-noise absolute inset-0" />
      <div className="site-backdrop-sweep scan-sweep" />
      <div className="site-backdrop-hairline absolute inset-x-0 top-0 h-px" />
    </div>
  );
}
