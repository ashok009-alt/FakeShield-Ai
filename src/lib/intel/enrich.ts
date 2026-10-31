import { checkOfficialDomains, detectOtp } from "@/lib/analysis/localIntel";
import type { AnalysisResult, InputType } from "@/lib/analysis/types";
import { enhanceWithGemini } from "./gemini";

export interface EnrichOptions {
  inputType: InputType;
  /** Message text, email subject + body, or the URL string. */
  text: string;
  senderEmail?: string;
  headers?: { from?: string; replyTo?: string; subject?: string };
}

/**
 * Shared post-processing for every analysis route:
 *   1. local impersonation + OTP checks (no network);
 *   2. optional Gemini semantic review blended with the rule score.
 * Order matters: Gemini sees the same raw input, and the official-domain check
 * stays fully deterministic.
 */
export async function enrichResult(
  result: AnalysisResult,
  options: EnrichOptions
): Promise<AnalysisResult> {
  const officialDomain =
    checkOfficialDomains(
      [options.headers?.subject, options.text].filter(Boolean).join("\n"),
      { senderEmail: options.senderEmail }
    ) ?? undefined;

  const otp = options.inputType === "url" ? undefined : detectOtp(options.text);

  const withLocal: AnalysisResult = {
    ...result,
    ...(officialDomain ? { officialDomain } : {}),
    ...(otp ? { otp } : {}),
  };

  return enhanceWithGemini(withLocal, {
    inputType: options.inputType,
    text: options.text,
    headers: options.headers,
  });
}
