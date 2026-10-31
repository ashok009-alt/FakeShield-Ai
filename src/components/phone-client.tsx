"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Flag,
  Info,
  Loader2,
  Phone,
  PhoneCall,
  Radio,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { lookupPhone, reportPhone } from "@/lib/api-client";
import { phoneVerdict, PHONE_REPORT_CATEGORIES, type PhoneLookup, type PhoneReportCategory } from "@/lib/phone";
import { phoneIntelSeeds } from "@/lib/data/phone-intel";
import { RISK_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SAMPLE_NUMBERS = ["+917406231890", "+919876543210", "+918885550199", "+917012345678"];

export function PhoneLookupClient() {
  const [number, setNumber] = useState("");
  const [lookup, setLookup] = useState<PhoneLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
      busyRef.current = false;
    },
    []
  );

  async function run(nextNumber?: string) {
    const target = (nextNumber ?? number).trim();
    if (target.replace(/\D/g, "").length < 8) {
      setError("Enter a phone number with at least 8 digits, including the country code if you know it.");
      return;
    }
    if (busyRef.current) return;

    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await lookupPhone(target, controller.signal);
      if (controller.signal.aborted) return;
      setLookup(data);
      setNumber(target);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Phone lookup failed.";
      setError(message);
      toast.error(message);
    } finally {
      if (abortRef.current === controller) {
        busyRef.current = false;
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label htmlFor="phone-input" className="text-sm font-semibold text-foreground">
              Phone number to check
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Indian numbers can be typed as 98765 43210 — the +91 is added automatically.
            </p>
          </div>
          <Badge variant="warning">
            <Radio className="size-3" />
            Illustrative community data
          </Badge>
        </div>

        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <Input
              id="phone-input"
              value={number}
              onChange={(event) => {
                setNumber(event.target.value);
                if (error) setError(null);
              }}
              placeholder="+91 74062 31890"
              className="h-12 pl-10 text-[14px] tabular-nums"
              inputMode="tel"
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
          </div>
          <Button type="submit" disabled={loading} className="h-12 shrink-0 sm:w-44">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search className="size-4" />
                Look up number
              </>
            )}
          </Button>
        </form>

        {error ? (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="text-[11px] text-stone-500">Most-reported samples:</span>
          {SAMPLE_NUMBERS.map((sample) => {
            const seed = phoneIntelSeeds.find((item) => item.number === sample);
            return (
              <button
                key={sample}
                type="button"
                onClick={() => void run(sample)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  lookup?.number === sample
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                    : "border-border bg-white/[0.02] text-stone-400 hover:border-stone-600 hover:text-stone-200"
                )}
              >
                <span className="tabular-nums">{sample.replace("+91", "")}</span>
                {seed ? (
                  <span className="text-[10px] text-stone-500">{seed.reportCount} reports</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="surface space-y-4 rounded-2xl p-6">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-36 w-full" />
        </div>
      ) : lookup ? (
        <LookupResult lookup={lookup} onReported={setLookup} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Users}
            title="Community reports, aggregated"
            detail="Each report adds one count and a category. Repeated reports from the same session are rate-limited."
          />
          <InfoCard
            icon={ShieldAlert}
            title="Risk, not a verdict"
            detail="A number can be spoofed, re-used, or have no reports yet. Treat counts as a warning, not proof."
          />
          <InfoCard
            icon={PhoneCall}
            title="No call is ever made"
            detail="FakeShield never dials, messages or pings the number. Lookup is a database query only."
          />
        </div>
      )}
    </div>
  );
}

function LookupResult({
  lookup,
  onReported,
}: {
  lookup: PhoneLookup;
  onReported: (next: PhoneLookup) => void;
}) {
  const verdict = phoneVerdict(lookup);
  const meta = RISK_META[lookup.riskLevel];
  const maxCount = Math.max(1, ...lookup.categories.map((category) => category.count));
  const tone =
    verdict.tone === "Critical" || verdict.tone === "High"
      ? { border: "border-red-500/25", bg: "bg-red-500/[0.05]", text: "text-red-300" }
      : verdict.tone === "Medium"
        ? { border: "border-amber-500/25", bg: "bg-amber-500/[0.05]", text: "text-amber-300" }
        : { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", text: "text-emerald-300" };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className={cn("surface relative overflow-hidden rounded-2xl border p-5 sm:p-6", tone.border, tone.bg)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Reported number
              </p>
              <p className="mono mt-1 text-lg font-semibold text-stone-100">{lookup.display}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", meta.border, meta.bg, meta.text)}>
                {meta.label}
              </span>
              <Badge variant="outline">Demo dataset</Badge>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className={cn("text-5xl font-semibold tabular-nums tracking-tight", tone.text)}>
              {lookup.reportCount.toLocaleString("en-IN")}
            </span>
            <span className="mb-1.5 max-w-[16rem] text-[12.5px] leading-5 text-stone-400">
              {lookup.reportCount === 1 ? "person reported" : "people reported"} this number as
              suspicious or fraudulent
            </span>
          </div>

          <p className="mt-4 text-[13px] leading-6 text-stone-300">{lookup.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ReportDialog lookup={lookup} onReported={onReported} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard?.writeText(lookup.display);
                toast.success("Number copied");
              }}
            >
              Copy number
            </Button>
            <span className="inline-flex items-center gap-1 text-[10.5px] text-stone-500">
              <Info className="size-3" />
              {lookup.lastReportedAt
                ? `Last report ${relativeTime(lookup.lastReportedAt)}`
                : "No community reports yet"}
            </span>
          </div>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">What people reported</h3>
            <span className="text-[10.5px] text-stone-500">
              {lookup.categories.length} categor{lookup.categories.length === 1 ? "y" : "ies"}
            </span>
          </div>
          {lookup.categories.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {lookup.categories.map((category) => (
                <li key={category.name}>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-stone-300">{category.name}</span>
                    <span className="tabular-nums text-stone-500">{category.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={cn("h-full rounded-full", verdict.tone === "Critical" || verdict.tone === "High" ? "bg-red-400/80" : "bg-amber-400/80")}
                      style={{ width: `${Math.max(4, (category.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12.5px] leading-6 text-stone-500">
              No category breakdown yet. A new report will start the breakdown.
            </p>
          )}
          <p className="mt-4 border-t border-border/60 pt-3 text-[10.5px] leading-5 text-stone-500">
            Report counts are aggregated from this demo&apos;s community dataset, including reports
            submitted in this browser session. They are not a verified fraud registry.
          </p>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-32">
        <div className="surface rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground">Number checks</h3>
          <ul className="mt-3 space-y-2.5">
            {lookup.checks.map((check) => {
              const Icon = check.status === "good" ? CheckCircle2 : check.status === "warn" ? AlertTriangle : Info;
              return (
                <li key={check.label} className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      check.status === "good"
                        ? "text-emerald-300"
                        : check.status === "warn"
                          ? "text-amber-300"
                          : "text-stone-500"
                    )}
                  />
                  <div>
                    <p className="text-[12px] font-medium text-stone-200">{check.label}</p>
                    <p className="text-[11px] leading-5 text-stone-500">{check.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-border/60 pt-3 text-[10.5px] leading-5 text-stone-500">
            Valid: {lookup.valid ? "yes" : "no"} · Source:{" "}
            {lookup.found ? (lookup.source === "seeded" ? "seeded demo record" : "local reports") : "no record"}.
            Format checks cannot tell you who owns a number.
          </p>
        </div>

        <div className={cn("rounded-2xl border p-5", tone.border, tone.bg)}>
          <div className="flex items-start gap-2.5">
            <ShieldAlert className={cn("mt-0.5 size-4 shrink-0", tone.text)} />
            <div>
              <h3 className={cn("text-[13px] font-semibold", tone.text)}>{verdict.headline}</h3>
              <p className="mt-1 text-[11.5px] leading-5 text-stone-400">{verdict.detail}</p>
            </div>
          </div>
        </div>

        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] px-5 py-4 transition-colors hover:border-orange-500/40"
        >
          <span>
            <span className="block text-[12.5px] font-semibold text-orange-200">
              Report financial fraud officially
            </span>
            <span className="block text-[10.5px] text-stone-500">
              cybercrime.gov.in · helpline 1930
            </span>
          </span>
          <ArrowRight className="size-4 text-orange-300 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}

function ReportDialog({
  lookup,
  onReported,
}: {
  lookup: PhoneLookup;
  onReported: (next: PhoneLookup) => void;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PhoneReportCategory>(PHONE_REPORT_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    setSaving(true);
    try {
      const next = await reportPhone({
        number: lookup.number,
        category,
        note: note.trim() || undefined,
      });
      onReported(next);
      toast.success("Report added", {
        description: `This number now has ${next.reportCount} community reports.`,
      });
      setOpen(false);
      setNote("");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Your report could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Flag className="size-3.5" />
          Report this number
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report {lookup.display}</DialogTitle>
          <DialogDescription>
            Your category is added to this demo&apos;s local count. The note stays in the local
            database and is not published anywhere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-stone-300">What happened?</label>
            <Select value={category} onValueChange={(value) => setCategory(value as PhoneReportCategory)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {PHONE_REPORT_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="phone-note" className="text-[12px] font-medium text-stone-300">
              Short note <span className="text-stone-500">(optional)</span>
            </label>
            <Textarea
              id="phone-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              rows={3}
              className="mt-1.5 min-h-[80px] text-[13px]"
              placeholder="e.g. Caller claimed my electricity would be cut and asked for an OTP."
            />
            <p className="mt-1 text-right text-[10px] text-stone-600">{note.length}/240</p>
          </div>

          <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[10.5px] leading-5 text-amber-200/80">
            Never include your OTP, card number, account number or passwords in a report.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />}
            {saving ? "Adding…" : "Add report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Users;
  title: string;
  detail: string;
}) {
  return (
    <div className="surface rounded-2xl p-5">
      <span className="grid size-9 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.08]">
        <Icon className="size-4 text-orange-300" />
      </span>
      <h3 className="mt-3 text-[13px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-[11.5px] leading-5 text-stone-500">{detail}</p>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
