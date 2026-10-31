"use client";

import { useEffect } from "react";

/**
 * Registers the service worker after the page has settled, so installation
 * never competes with first paint. Registration is production-only to keep
 * hot-reload predictable in development.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* installability is a progressive enhancement */
      });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
