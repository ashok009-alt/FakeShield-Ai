"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; message: string; configured: boolean };

export function DigestSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "loading") return;

    if (!consent) {
      setState({ kind: "error", message: "Tick the consent box so we can store the address." });
      return;
    }

    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/digest/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });
      const payload = (await response.json()) as {
        message?: string;
        deliveryConfigured?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setState({
          kind: "error",
          message:
            response.status === 429
              ? "Slow down a moment, then try again."
              : payload.error ?? "That did not work. Check the address and try again.",
        });
        return;
      }

      setState({
        kind: "done",
        message: payload.message ?? "You are on the list.",
        configured: Boolean(payload.deliveryConfigured),
      });
      setEmail("");
      setConsent(false);
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <section className="surface mt-6 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="size-4 text-orange-300" />
            Weekly threat report by email
          </h2>
          <p className="mt-1 text-[11.5px] leading-5 text-stone-400">
            One short email a week with the scam types rising fastest, the script behind them, and one
            habit that blocks them. No account, no tracking pixels, unsubscribe in every issue.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor="digest-email" className="sr-only">
            Email address
          </label>
          <Input
            id="digest-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={200}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={state.kind === "loading"}
          />
          <label className="mt-2 flex items-start gap-2 text-[10.5px] leading-4 text-stone-500">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 size-3.5 rounded border-white/20 bg-transparent accent-orange-500"
              disabled={state.kind === "loading"}
            />
            <span>
              Store this address in the demo database to receive the weekly summary. The address is
              not used for anything else.
            </span>
          </label>
        </div>
        <Button type="submit" disabled={state.kind === "loading"} className="sm:mt-0">
          {state.kind === "loading" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving…
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>

      {state.kind === "error" ? (
        <p className="mt-3 text-[11px] text-red-300">{state.message}</p>
      ) : null}
      {state.kind === "done" ? (
        <p className={`mt-3 text-[11px] ${state.configured ? "text-emerald-300" : "text-amber-300"}`}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
