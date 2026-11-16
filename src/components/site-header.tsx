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
        "sticky top-0 z-40 border-b transition-all duration-200",
        scrolled
          ? "border-slate-800/80 bg-slate-950/90 shadow-lg shadow-black/50 backdrop-blur-xl"
          : "border-slate-800/40 bg-slate-950/70 backdrop-blur-md"
      )}
    >
      <ThreatTicker />
      <SystemStatusStrip threatFeed={threatFeed} providers={providers} />
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="FakeShield AI home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
                  active
                    ? "text-white bg-slate-800/80"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
              >
                {link.label}
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
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                moreActive || moreOpen
                  ? "bg-slate-800/80 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              More
              <ChevronDown className={cn("size-3.5 transition-transform", moreOpen ? "rotate-180" : "")} />
            </button>

            {moreOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
                {MORE_LINKS.map((link) => {
                  const active =
                    pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors",
                        active ? "bg-blue-600/15 text-blue-300" : "hover:bg-slate-800/70 text-slate-300"
                      )}
                    >
                      <span>
                        <span className="block text-[12.5px] font-medium text-slate-100">
                          {link.label}
                        </span>
                        <span className="block text-[10.5px] text-slate-400">{link.detail}</span>
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <BrightnessToggle />
          <Link
            href="/analyze"
            className="hidden sm:inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98]"
          >
            Scan threat
            <ArrowRight className="size-3.5" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800/60"
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
        <div id="mobile-nav" className="border-t border-slate-800/80 bg-slate-950/98 backdrop-blur-xl lg:hidden">
          <nav aria-label="Mobile navigation" className="page-shell flex flex-col py-3">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] transition-colors",
                    active ? "bg-blue-600/15 font-semibold text-blue-400" : "text-slate-300 hover:bg-slate-900"
                  )}
                >
                  {link.label}
                  <ArrowRight className="size-3.5 text-slate-500" />
                </Link>
              );
            })}
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              More Tools
            </p>
            {MORE_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] transition-colors",
                    active ? "bg-blue-600/15 text-blue-300 font-semibold" : "text-slate-300 hover:bg-slate-900"
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="size-3 text-slate-500" />
                </Link>
              );
            })}
            <div className="px-3 pt-3">
              <Link
                href="/analyze"
                className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-colors"
              >
                Scan Threat Now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
