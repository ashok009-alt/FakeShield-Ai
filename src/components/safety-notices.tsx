"use client";

import { BadgeCheck, KeyRound, ShieldAlert, ShieldX } from "lucide-react";
import type { OfficialDomainCheck, OtpExposure } from "@/lib/analysis/types";

/**
 * Deterministic, high-visibility notices shown above the detailed panels.
 * The OTP text never repeats the code itself.
 */
export function SafetyNotices({
  otp,
  officialDomain,
}: {
  otp?: OtpExposure;
  officialDomain?: OfficialDomainCheck;
}) {
  const showOtp = Boolean(otp && (otp.requested || otp.codeDetected));
  if (!showOtp && !officialDomain) return null;

  return (
    <div className="space-y-3">
      {showOtp && otp ? (
        <div
          role="alert"
          className={
            otp.requested
              ? "flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3.5"
              : "flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-3.5"
          }
        >
          <span
            className={
              otp.requested
                ? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-red-500/30 bg-red-500/10"
                : "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-amber-500/25 bg-amber-500/10"
            }
          >
            <KeyRound
              className={otp.requested ? "size-4 text-red-300" : "size-4 text-amber-300"}
            />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={
                  otp.requested
                    ? "text-[13px] font-bold text-red-200"
                    : "text-[13px] font-bold text-amber-200"
                }
              >
                {otp.requested
                  ? "Never share this one-time code"
                  : "This message contains a one-time code"}
              </p>
              {otp.codeDetected && otp.codeLength ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-stone-400">
                  {otp.codeLength}-digit code · hidden
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12px] leading-5 text-stone-400">{otp.detail}</p>
            {otp.requested ? (
              <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
                No bank, UPI app, courier or government office will ask you to read out, forward or
                type a code to “verify”, “cancel” or “receive” money.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {officialDomain ? (
        <div
          className={
            officialDomain.mismatch
              ? "flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3.5"
              : "flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5"
          }
        >
          <span
            className={
              officialDomain.mismatch
                ? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-red-500/30 bg-red-500/10"
                : "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/10"
            }
          >
            {officialDomain.mismatch ? (
              <ShieldX className="size-4 text-red-300" />
            ) : (
              <BadgeCheck className="size-4 text-emerald-300" />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={
                officialDomain.mismatch
                  ? "text-[13px] font-bold text-red-200"
                  : "text-[13px] font-bold text-emerald-200"
              }
            >
              {officialDomain.mismatch
                ? `Not an official ${officialDomain.brand} domain`
                : `Official ${officialDomain.brand} domain`}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-stone-400">{officialDomain.detail}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              {officialDomain.observedDomain ? (
                <span className="mono rounded border border-white/10 bg-black/25 px-2 py-0.5 text-stone-300">
                  {officialDomain.observedDomain}
                </span>
              ) : null}
              <span className="text-stone-600">official:</span>
              {officialDomain.officialDomains.map((domain) => (
                <span
                  key={domain}
                  className="mono rounded border border-emerald-500/15 bg-emerald-500/[0.05] px-2 py-0.5 text-emerald-200/80"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function safetyNoticeSummary(otp?: OtpExposure, officialDomain?: OfficialDomainCheck): string {
  const parts: string[] = [];
  if (otp?.requested) parts.push("never share the one-time code");
  if (officialDomain?.mismatch) parts.push(`the link is not an official ${officialDomain.brand} domain`);
  return parts.length > 0 ? `Attention: ${parts.join("; ")}.` : "";
}
