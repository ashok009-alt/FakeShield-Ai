"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MailSearch, Sparkles } from "lucide-react";
import { analyzeEmail } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { emailSamples } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmailPreview } from "@/components/email-preview";
import { ResultPanel } from "@/components/result-panel";
import { ResultSkeleton } from "@/components/result-skeleton";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { cn } from "@/lib/utils";

interface FormState {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  subject: string;
  body: string;
}

const EMPTY_FORM: FormState = {
  fromName: "",
  fromEmail: "",
  replyTo: "",
  subject: "",
  body: "",
};

const FREE_HINT = "gmail.com, yahoo.com, outlook.com, rediffmail.com…";

export function EmailAnalyzerClient() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [checkBreach, setCheckBreach] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function loadSample(id: string) {
    const sample = emailSamples.find((item) => item.id === id);
    if (!sample) return;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      busyRef.current = false;
      setLoading(false);
    }
    setForm({
      fromName: sample.fromName,
      fromEmail: sample.fromEmail,
      replyTo: sample.replyTo ?? "",
      subject: sample.subject,
      body: sample.body,
    });
    setActiveSample(id);
    setResult(null);
    setError(null);
    setFieldErrors({});
  }

  function randomSample() {
    const pool = emailSamples.filter((sample) => sample.id !== activeSample);
    const sample = pool[Math.floor(Math.random() * pool.length)];
    if (sample) loadSample(sample.id);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.fromEmail.trim())) {
      errors.fromEmail = "Enter a valid sender email address.";
    }
    if (form.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.replyTo.trim())) {
      errors.replyTo = "Reply-to must be a valid email address.";
    }
    if (!form.subject.trim()) errors.subject = "Add the subject line (or type “none”).";
    if (form.body.trim().length < 10) errors.body = "Paste the email body (at least 10 characters).";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function run() {
    if (busyRef.current) return;
    if (!validate()) {
      setError("Check the highlighted fields before analysing.");
      return;
    }

    busyRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeEmail(
        {
          fromName: form.fromName.trim() || undefined,
          fromEmail: form.fromEmail.trim(),
          replyTo: form.replyTo.trim() || undefined,
          subject: form.subject.trim(),
          body: form.body,
          checkBreach,
        },
        controller.signal
      );
      if (controller.signal.aborted) return;
      setResult(data);
      if (data.id) {
        toast.success("Email analysis saved to history");
      } else {
        toast.warning("Analysed, but not saved", {
          description: "The history database could not be reached.",
        });
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Email analysis failed.";
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Message details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste the header fields as they appear in your mail app. Optional fields help, but
              are not required.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={randomSample} type="button">
              <Sparkles className="size-3.5" />
              Try a sample
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {emailSamples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                activeSample === sample.id
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                  : "border-border bg-white/[0.02] text-stone-400 hover:border-stone-600 hover:text-stone-200"
              )}
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fromName">Sender name</Label>
            <Input
              id="fromName"
              className="mt-1.5"
              placeholder="e.g. PayPal Security"
              value={form.fromName}
              onChange={(event) => update("fromName", event.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor="fromEmail">Sender email address</Label>
            <Input
              id="fromEmail"
              className={cn("mt-1.5", fieldErrors.fromEmail && "border-red-500/50")}
              placeholder="e.g. service@paypal-secure-login.xyz"
              value={form.fromEmail}
              onChange={(event) => update("fromEmail", event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.fromEmail)}
              aria-describedby={fieldErrors.fromEmail ? "fromEmail-error" : undefined}
            />
            {fieldErrors.fromEmail ? (
              <p id="fromEmail-error" className="mt-1 text-[11px] text-red-300">
                {fieldErrors.fromEmail}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-stone-500">Check the domain, not just the name.</p>
            )}
          </div>
          <div>
            <Label htmlFor="replyTo">Reply-to (optional)</Label>
            <Input
              id="replyTo"
              className={cn("mt-1.5", fieldErrors.replyTo && "border-red-500/50")}
              placeholder="Only if it differs from the sender"
              value={form.replyTo}
              onChange={(event) => update("replyTo", event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.replyTo)}
            />
            {fieldErrors.replyTo ? (
              <p className="mt-1 text-[11px] text-red-300">{fieldErrors.replyTo}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              className={cn("mt-1.5", fieldErrors.subject && "border-red-500/50")}
              placeholder="e.g. Urgent: your account has been limited"
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
              autoComplete="off"
            />
            {fieldErrors.subject ? (
              <p className="mt-1 text-[11px] text-red-300">{fieldErrors.subject}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-body">Email body</Label>
            <span className="text-[10px] text-stone-500">
              Links and display text are compared automatically
            </span>
          </div>
          <Textarea
            id="email-body"
            ref={bodyRef}
            className={cn("mt-1.5 min-h-[190px]", fieldErrors.body && "border-red-500/50")}
            placeholder="Paste the email body here. HTML is fine — it is stripped for preview and analysis."
            value={form.body}
            onChange={(event) => update("body", event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void run();
              }
            }}
            maxLength={20000}
            spellCheck={false}
            aria-invalid={Boolean(fieldErrors.body)}
          />
          {fieldErrors.body ? (
            <p className="mt-1 text-[11px] text-red-300">{fieldErrors.body}</p>
          ) : (
            <p className="mt-1.5 text-[10px] leading-5 text-stone-500">
              Free mail domains are worth knowing: {FREE_HINT}. An official sender using one is a
              warning sign.
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="flex items-start gap-2.5 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
            <input
              type="checkbox"
              checked={checkBreach}
              onChange={(event) => setCheckBreach(event.target.checked)}
              className="mt-0.5 size-3.5 accent-orange-500"
            />
            <span>
              <span className="block text-[11.5px] font-medium text-stone-300">
                Check the sender address against known data breaches
              </span>
              <span className="mt-0.5 block text-[10px] leading-5 text-stone-500">
                Optional. Only if you tick this box, the sender address is sent to Have I Been
                Pwned. A breach list is context, not proof that this email is fraudulent.
              </span>
            </span>
          </label>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-[11px] text-stone-500">
            Ctrl/Cmd + Enter analyses from the body field.
          </p>
          <Button onClick={() => void run()} disabled={loading} type="button">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analysing email…
              </>
            ) : (
              <>
                <MailSearch className="size-4" />
                Analyze email
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ResultSkeleton />
          <ResultSkeleton />
        </div>
      ) : result && result.email ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="lg:sticky lg:top-32">
            <EmailPreview email={result.email} />
          </div>
          <ResultPanel
            result={result}
            onReset={() => {
              setResult(null);
              setForm(EMPTY_FORM);
              setActiveSample(null);
            }}
          />
        </div>
      ) : (
        <AnalyzerEmptyState
          icon={MailSearch}
          title="Sender, links and risk — side by side"
          description="Paste a suspicious email to see its header details beside the assessment. The preview never loads remote content and never opens links."
          steps={[
            "Copy the sender address and subject exactly as shown.",
            "Paste the body — HTML is fine.",
            "Compare the sender domain and link destinations with the official organisation.",
          ]}
        />
      )}
    </div>
  );
}
