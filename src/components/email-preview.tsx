import { AlertTriangle, ArrowLeftRight, Mail, Reply } from "lucide-react";
import type { EmailMeta } from "@/lib/analysis/types";
import { Badge } from "@/components/ui/badge";

export function EmailPreview({ email }: { email: EmailMeta }) {
  const initials = (email.fromName || email.fromEmail)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="surface overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-stone-200">
          <Mail className="size-4 text-orange-300" />
          Email preview
        </div>
        <Badge variant="outline">Text rendered safely</Badge>
      </div>

      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full border border-orange-500/20 bg-orange-500/10 text-[11px] font-semibold text-orange-200">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-foreground">{email.fromName}</span>
              <span className="mono truncate text-[11px] text-stone-400">
                &lt;{email.fromEmail}&gt;
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-stone-500">to you</p>
            {email.replyTo ? (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/[0.07] px-2 py-1 text-[10px] text-amber-200">
                <Reply className="size-3" />
                Replies go to a different address:
                <span className="mono">{email.replyTo}</span>
              </p>
            ) : null}
          </div>
        </div>

        <h3 className="mt-4 text-[15px] font-semibold leading-6 text-foreground">
          {email.subject}
        </h3>
      </div>

      <div className="max-h-72 overflow-y-auto px-5 py-5">
        <p className="whitespace-pre-wrap text-[13px] leading-7 text-stone-300">{email.body}</p>
      </div>

      {email.links.length > 0 ? (
        <div className="border-t border-border/60 px-5 py-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Links found · {email.links.length}
          </h4>
          <ul className="mt-2.5 space-y-2">
            {email.links.map((link) => (
              <li
                key={`${link.href}-${link.displayText ?? ""}`}
                className="rounded-lg border border-border/70 bg-black/20 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono break-all text-[11px] text-stone-300">{link.href}</span>
                  {link.mismatched ? (
                    <span className="inline-flex items-center gap-1 rounded border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300">
                      <AlertTriangle className="size-3" />
                      Display text differs
                    </span>
                  ) : null}
                </div>
                {link.displayText ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-500">
                    <ArrowLeftRight className="size-3" />
                    Displayed as: <span className="mono text-stone-400">{link.displayText}</span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-stone-500">
            Links are shown as text only. FakeShield never opens them.
          </p>
        </div>
      ) : null}
    </div>
  );
}
