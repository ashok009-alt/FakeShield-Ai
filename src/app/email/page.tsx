import type { Metadata } from "next";
import { EmailAnalyzerClient } from "@/components/email-client";

export const metadata: Metadata = {
  title: "Phishing email detector",
  description:
    "Paste an email's sender, reply-to, subject and body to check for domain mismatches, lookalikes, risky links and pressure tactics.",
};

export default function EmailPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
          Email analyzer
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Check the sender, not just the logo.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          Phishing emails rely on small details: a mismatched reply-to, a lookalike domain, or link
          text that hides the real destination. FakeShield compares those details and shows its
          reasoning.
        </p>
      </div>

      <div className="mt-8">
        <EmailAnalyzerClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        Only paste content you are comfortable storing in this local demo database. Do not include
        real passwords, OTPs or full card numbers in the body. FakeShield explains risk; it cannot
        confirm an email is genuine.
      </p>
    </div>
  );
}
