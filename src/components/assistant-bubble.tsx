"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { answerQuestion } from "@/lib/assistant";
import { useAssistantStore } from "@/lib/assistant-store";
import { cn } from "@/lib/utils";

export function AssistantBubble() {
  const { open, setOpen, messages, addMessage, context, reset } = useAssistantStore();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, thinking, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  function submit(question?: string) {
    const text = (question ?? input).trim();
    if (!text || thinking) return;
    addMessage({ role: "user", text });
    setInput("");
    setThinking(true);
    const reply = answerQuestion(text, context);
    timerRef.current = setTimeout(() => {
      addMessage({ role: "assistant", ...reply });
      setThinking(false);
    }, 420);
  }

  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="Ask FakeShield assistant"
          className="fixed bottom-3 right-3 z-40 flex h-[min(600px,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-[384px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80 sm:bottom-5 sm:right-5 backdrop-blur-xl"
        >
          <header className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-3">
            <span className="grid size-7 place-items-center rounded-lg border border-blue-500/25 bg-blue-500/10">
              <ShieldCheck className="size-4 text-blue-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">Ask FakeShield</p>
              <p className="truncate text-[10px] text-slate-400">
                {context
                  ? `Context: ${context.riskLevel} ${context.inputType} · ${context.riskScore}/100`
                  : "Rule-based safety assistant"}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Clear conversation"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl px-3 py-2 text-[12px] leading-5",
                    message.role === "user"
                      ? "bg-blue-600 text-white font-medium"
                      : "border border-slate-800 bg-slate-950/60 text-slate-200"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  {message.links && message.links.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.links.map((link) => {
                        const external = link.href.startsWith("http") || link.href.startsWith("tel:");
                        const className =
                          "inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-orange-200 hover:bg-orange-500/15";
                        return external ? (
                          <a
                            key={link.href}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel="noreferrer noopener"
                            className={className}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link key={link.href} href={link.href} className={className}>
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {thinking ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="size-1.5 animate-pulse rounded-full bg-stone-500"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {!thinking && lastAssistant?.chips && lastAssistant === messages[messages.length - 1] ? (
              <div className="flex flex-wrap gap-1.5 pl-0.5">
                {lastAssistant.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submit(chip)}
                    className="rounded-full border border-border bg-white/[0.02] px-2.5 py-1 text-[10px] text-stone-400 transition-colors hover:border-orange-500/30 hover:text-orange-200"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="border-t border-slate-800 bg-slate-950/90 px-3.5 py-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a result or a scam pattern…"
                aria-label="Message the assistant"
                maxLength={400}
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-[12px] text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send message"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40 cursor-pointer"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] leading-4 text-slate-500">
              Rule-based deterministic answers. Always verify with official sources.
            </p>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Ask FakeShield assistant"
          className="group fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-slate-900/90 py-2 pl-2.5 pr-3 text-blue-200 shadow-xl shadow-black/50 transition-all hover:border-blue-400 hover:bg-slate-800 sm:bottom-6 sm:right-6 sm:pr-4 backdrop-blur-md cursor-pointer"
        >
          <span className="relative grid size-8 place-items-center rounded-full bg-blue-500/20 text-blue-400">
            <Sparkles className="size-4" />
            {context ? (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-slate-900 bg-emerald-400" />
            ) : null}
          </span>
          <span className="hidden text-xs font-semibold sm:inline">Ask FakeShield</span>
        </button>
      )}
    </>
  );
}
