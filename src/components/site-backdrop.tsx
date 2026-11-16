"use client";

import { usePathname } from "next/navigation";

export function SiteBackdrop() {
  const pathname = usePathname();
  if (pathname === "/offline") return null;

  return (
    <div
      className="site-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top subtle blue ambient glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] rounded-full blur-[120px] opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.4) 0%, rgba(14, 165, 233, 0.15) 40%, transparent 70%)",
        }}
      />

      {/* Subtle bottom-right accent glow */}
      <div
        className="absolute -bottom-40 right-0 h-[400px] w-[600px] rounded-full blur-[140px] opacity-15"
        style={{
          background:
            "radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 0%, transparent 60%)",
        }}
      />

      {/* Precision Micro Dot Matrix */}
      <div className="absolute inset-0 dot-matrix opacity-40" />

      {/* Top Hairline border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
    </div>
  );
}
