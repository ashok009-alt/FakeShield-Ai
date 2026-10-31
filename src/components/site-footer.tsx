import Link from "next/link";
import { Logo } from "@/components/logo";
import { DISCLAIMER_TEXT } from "@/lib/constants";
import { ShieldCheck, Radio } from "lucide-react";

const GROUPS = [
  {
    title: "Check something",
    links: [
      { href: "/analyze", label: "Message analyzer" },
      { href: "/email", label: "Email analyzer" },
      { href: "/image", label: "Screenshot analyzer" },
      { href: "/forward", label: "Forward detector" },
      { href: "/link", label: "Link checker" },
      { href: "/language", label: "Regional languages" },
    ],
  },
  {
    title: "Protect & share",
    links: [
      { href: "/phone", label: "Phone number lookup" },
      { href: "/protect", label: "Family protection" },
      { href: "/community", label: "Community feed" },
      { href: "/trends", label: "Scam trends" },
      { href: "/extension", label: "Extension concept" },
      { href: "/channels", label: "SMS & chat bots" },
      { href: "/history", label: "Analysis history" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/patterns", label: "Scam pattern library" },
      { href: "/learn", label: "Response guides" },
      { href: "/quiz", label: "Security quiz" },
      { href: "/demo", label: "30-second demo" },
      { href: "/platform", label: "Platform overview" },
      { href: "/about", label: "How it works" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer
      className="relative z-10 mt-20 border-t border-[#3a2a1c]"
      style={{ background: "linear-gradient(180deg, rgba(11,7,4,0.88) 0%, rgba(10,6,4,0.96) 100%)" }}
    >
      <div className="page-shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[13.5px] leading-6 text-stone-500">
              Explainable threat intelligence for suspicious messages, emails and URLs.
              Built to help you make an informed decision — not replace professional security review.
            </p>
            {/* Disclaimer block */}
            <div
              className="mt-5 flex items-start gap-2.5 rounded-sm border border-[#4a3422] p-3 max-w-xs"
              style={{ background: "rgba(249,115,22,0.03)" }}
            >
              <ShieldCheck className="size-3.5 text-amber-500/60 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 text-stone-600">{DISCLAIMER_TEXT}</p>
            </div>
          </div>

          {/* Link groups */}
          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-4">
                {group.title}
              </h2>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-stone-500 transition-colors hover:text-amber-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[#3a2a1c] pt-6 text-[11px] text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-3 text-amber-600/50" />
            <span>© {new Date().getFullYear()} FakeShield AI · Hackathon Demo · Next.js 15</span>
          </div>
          <p>Independent project — not affiliated with any bank, courier, or government body.</p>
        </div>
        <p className="mt-2 text-[10.5px] text-stone-700">
          Inputs stored in a local SQLite database scoped to your anonymous session. Deletable at any time from History.
        </p>
      </div>
    </footer>
  );
}
