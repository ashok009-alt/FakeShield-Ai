import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* Shield icon — angular, professional */}
      <span
        className="relative grid size-9 shrink-0 place-items-center rounded-lg"
        style={{
          background: "linear-gradient(145deg, #2a1808 0%, #1a120b 100%)",
          border: "1px solid #543a24",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(249,115,22,0.12)",
        }}
      >
        <svg viewBox="0 0 32 32" className="size-[18px]" aria-hidden="true">
          <defs>
            <linearGradient id="logo-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fb923c" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Shield path — sharper, more angular */}
          <path
            d="M16 2 L28 6.5V15c0 6.5-5 11.5-12 14C5 26.5 0 21.5 0 15V6.5Z"
            transform="translate(2,0)"
            fill="rgba(249,115,22,0.12)"
            stroke="url(#logo-grad)"
            strokeWidth="1.4"
            strokeLinejoin="miter"
          />
          {/* Checkmark */}
          <path
            d="M11 15.5l3.2 3.2 6.8-7.4"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span className="flex flex-col leading-none">
        <span className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold tracking-tight text-white">
            FakeShield
          </span>
          <span
            className="rounded-sm px-1.5 py-[2px] text-[9px] font-black tracking-widest uppercase"
            style={{
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
              color: "#fb923c",
              letterSpacing: "0.15em",
            }}
          >
            AI
          </span>
        </span>
        <span className="text-[9px] font-medium tracking-widest uppercase text-stone-500 mt-[2px]">
          Threat Intelligence
        </span>
      </span>
    </span>
  );
}
