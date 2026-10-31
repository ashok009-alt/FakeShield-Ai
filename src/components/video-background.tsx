"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_SRC = "/videos/hero-bg.mp4";
const DEFAULT_POSTER = "/videos/hero-bg-poster.jpg";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * Decorative, muted background video.
 *
 * - The poster paints immediately; the video request is deferred until the
 *   browser is idle so it never competes with hydration or first input.
 * - Skipped entirely for reduced motion, Data Saver, and very slow connections.
 * - Pauses when the tab is hidden; fades in only once frames are playing.
 * - Never captures pointer events or keyboard focus.
 * - If the file cannot load, the poster/gradient stays visible untouched.
 */
export function VideoBackground({
  src = DEFAULT_SRC,
  poster = DEFAULT_POSTER,
  className,
  overlayClassName,
  opacity = 0.7,
  still = false,
}: {
  src?: string;
  poster?: string;
  className?: string;
  overlayClassName?: string;
  /** A number, or a CSS expression such as `var(--backdrop-video)`. */
  opacity?: number | string;
  /** Render only the poster frame — for secondary sections. */
  still?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (still) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const connection = (navigator as NavigatorWithConnection).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const start = () => setAllowVideo(true);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(start, 1200);
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [still]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPlayback = () => {
      if (motionQuery.matches || document.hidden) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        /* Autoplay can be blocked; the poster/gradient remains. */
      });
    };

    syncPlayback();
    motionQuery.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      motionQuery.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [allowVideo]);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        className="absolute inset-0 size-full object-cover transition-opacity duration-700"
        style={{ opacity: playing ? 0 : opacity }}
        draggable={false}
        decoding="async"
      />
      {!failed && !still && allowVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
          style={{ opacity: playing ? opacity : 0, transition: "opacity 700ms ease" }}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      <div className={cn("absolute inset-0", overlayClassName)} />
    </div>
  );
}
