"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { SystemStatusStrip } from "@/components/system-status-strip";
import { ThreatTicker } from "@/components/threat-ticker";
import { BrightnessToggle } from "@/components/brightness-toggle";
import { Button } from "@/components/ui/button";
import type { ProviderStatus } from "@/lib/intel/threatIntel";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/image", label: "Screenshot" },
  { href: "/forward", label: "Forwards" },
  { href: "/link", label: "Links" },
  { href: "/language", label: "Languages" },
  { href: "/trends", label: "Trends" },
];

const MORE_LINKS = [
  { href: "/phone", label: "Phone lookup", detail: "Community-reported numbers" },
  { href: "/protect", label: "Family check", detail: "A simple shareable YES / NO" },
  { href: "/community", label: "Community feed", detail: "Anonymised recent checks" },
  { href: "/extension", label: "Browser extension", detail: "Concept preview" },
  { href: "/channels", label: "SMS & chat bots", detail: "Twilio, Telegram, WhatsApp" },
  { href: "/patterns", label: "Pattern library", detail: "Scam scripts explained" },
  { href: "/learn", label: "Learn center", detail: "What to do after a scam" },
  { href: "/quiz", label: "Safety quiz", detail: "Test your instincts" },
  { href: "/history", label: "History", detail: "Your saved analyses" },
  { href: "/about", label: "How it works", detail: "Scoring and privacy" },
];

export function SiteHeader({
  threatFeed = false,
  providers,
}: {
  threatFeed?: boolean;
  providers: ProviderStatus;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const moreActive = MORE_LINKS.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  );

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-orange-500/10 bg-[#0b0704]/95 shadow-[0_1px_0_0_rgba(251,146,60,0.06),0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          : "border-transparent bg-[#0b0704]/80 backdrop-blur-md"
      )}
    >
      <ThreatTicker />
      <SystemStatusStrip threatFeed={threatFeed} providers={providers} />
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="FakeShield AI home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 xl:px-3",
                  active
                    ? "text-white"
                    : "text-stone-400 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {link.label}
                {active ? (
                  <>
                    <span className="absolute inset-x-3 -bottom-[15px] h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                    <span className="absolute inset-0 rounded-lg bg-orange-500/[0.06]" />
                  </>
                ) : null}
              </Link>
            );
          })}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors xl:px-3",
                moreActive || moreOpen
                  ? "bg-orange-500/[0.06] text-white"
                  : "text-stone-400 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              More
              <ChevronDown className={cn("size-3.5 transition-transform", moreOpen ? "rotate-180" : "")} />
            </button>

            {moreOpen ? (
              <div className="absolute right-0 top-[calc(100%+14px)] z-50 w-[320px] overflow-hidden rounded-xl border border-border bg-[#150e08] p-1.5 shadow-2xl shadow-black/70">
                {MORE_LINKS.map((link) => {
                  const active =
                    pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors",
                        active ? "bg-orange-500/10" : "hover:bg-white/[0.04]"
                      )}
                    >
                      <span>
                        <span className={cn("block text-[12px] font-medium", active ? "text-orange-200" : "text-stone-200")}>
                          {link.label}
                        </span>
                        <span className="block text-[10px] text-stone-500">{link.detail}</span>
                      </span>
                      <ArrowRight className="size-3 shrink-0 text-stone-600" />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-2.5">
          <BrightnessToggle />
          <Link
            href="/analyze"
            className="hidden sm:inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-[13px] font-semibold text-[#0b0704] shadow-[0_0_20px_rgba(251,146,60,0.35)] transition-all hover:shadow-[0_0_28px_rgba(251,146,60,0.5)] hover:from-orange-400 hover:to-orange-500 hover:-translate-y-px"
          >
            Analyze now
            <ArrowRight className="size-3.5" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-stone-400 hover:text-white hover:bg-white/[0.06]"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-white/[0.06] bg-[#0b0704]/98 backdrop-blur-xl lg:hidden">
          <nav aria-label="Mobile navigation" className="page-shell flex flex-col py-3">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors",
                    active
                      ? "bg-orange-500/[0.1] text-orange-200 border border-orange-500/15"
                      : "text-stone-300 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {active && <span className="live-dot" />}
                    {link.label}
                  </span>
                  <ArrowRight className="size-4 opacity-40" />
                </Link>
              );
            })}
            <p className="px-3 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-600">
              More tools
            </p>
            {MORE_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-orange-500/[0.1] text-orange-200 border border-orange-500/15"
                      : "text-stone-300 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {active && <span className="live-dot" />}
                    {link.label}
                  </span>
                  <ArrowRight className="size-4 opacity-40" />
                </Link>
              );
            })}
            <p className="px-3 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-600">
              Quick actions
            </p>
            <div className="px-3 pb-2 pt-1">
              <Link
                href="/analyze"
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-[#0b0704] shadow-[0_0_24px_rgba(251,146,60,0.4)]"
              >
                Analyze now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
