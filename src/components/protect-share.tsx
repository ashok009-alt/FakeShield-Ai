"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Link2, Share2, ShieldCheck, UserRound } from "lucide-react";
import { protectSlug, PROTECT_NAME_MAX } from "@/lib/protect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyText } from "@/lib/utils";

export function ProtectShareClient() {
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const slug = protectSlug(name);
  const href = `/protect/${encodeURIComponent(slug)}`;
  const fullUrl = origin ? `${origin}${href}` : href;

  async function handleCopy() {
    const ok = await copyText(fullUrl);
    if (ok) toast.success("Link copied", { description: `Send it to ${name.trim() || "your family"}.` });
    else toast.error("Could not copy the link. Select it manually.");
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FakeShield family check",
          text: "Paste any suspicious message here and get a simple yes / maybe / no answer.",
          url: fullUrl,
        });
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }
    void handleCopy();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <label htmlFor="protect-name" className="text-sm font-semibold text-foreground">
          Whose check is this?
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          A first name is enough. It appears in the link and on the shared page.
        </p>

        <div className="relative mt-3">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
          <Input
            id="protect-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Amma"
            maxLength={PROTECT_NAME_MAX}
            className="h-12 pl-10 text-[14px]"
            autoComplete="off"
          />
        </div>

        <div className="mt-4 rounded-xl border border-border bg-black/25 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Shareable link
          </p>
          <p className="mono mt-1.5 break-all text-[11.5px] leading-5 text-orange-200/90">{fullUrl}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void handleCopy()} variant="secondary" size="sm">
            <Copy className="size-3.5" />
            Copy link
          </Button>
          <Button onClick={() => void handleShare()} size="sm">
            <Share2 className="size-3.5" />
            Share link
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={href}>
              Preview the page
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
          {[
            "The link opens a blank checker — no message you tested is embedded in it.",
            "The reader pastes their own message and gets YES / MAYBE / NO.",
            "Results stay in their browser's anonymous session, not a public feed.",
          ].map((item) => (
            <p key={item} className="flex items-start gap-2 text-[11px] leading-5 text-stone-400">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border border-orange-500/20 bg-orange-500/[0.08]">
              <Link2 className="size-4 text-orange-300" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">What the other person sees</h2>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-[#0f0a06] p-4">
            <p className="text-center text-[9.5px] font-semibold uppercase tracking-[0.16em] text-orange-300/70">
              A safety check from {name.trim() || "Family"}
            </p>
            <p className="mt-2 text-center text-base font-semibold text-white">Got a suspicious message?</p>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-white/[0.06]" />
              <div className="h-2.5 w-11/12 rounded bg-white/[0.05]" />
              <div className="h-2.5 w-4/5 rounded bg-white/[0.04]" />
            </div>
            <div className="mt-3 grid h-9 place-items-center rounded-lg bg-orange-500/80 text-[11px] font-semibold text-[#180a02]">
              Check this message
            </div>
            <p className="mt-2 text-center text-[9px] text-stone-600">
              Plain YES / MAYBE / NO answer · no login
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            <div>
              <h3 className="text-[12.5px] font-semibold text-emerald-200">Why a shareable link helps</h3>
              <p className="mt-1 text-[11px] leading-5 text-stone-400">
                A parent or grandparent can check a message without learning a new app. The page is
                deliberately large, quiet and answer-first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
