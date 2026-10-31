import { analyzeMessage } from "@/lib/analysis/messageAnalyzer";
import { enrichResult } from "@/lib/intel/enrich";
import type { AnalysisResult } from "@/lib/analysis/types";

export type ChannelName = "sms" | "telegram" | "whatsapp";

export interface ChannelConfig {
  sms: boolean;
  telegram: boolean;
  whatsapp: boolean;
}

/**
 * A channel is only marked available when everything needed to *verify* the
 * webhook and *send* a reply is configured. Reporting "connected" with a
 * half-configured channel would be misleading.
 */
export function channelConfig(): ChannelConfig {
  return {
    sms: Boolean(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET),
    whatsapp: Boolean(
      process.env.WHATSAPP_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_VERIFY_TOKEN &&
        process.env.WHATSAPP_APP_SECRET
    ),
  };
}

/** Run the same rule engine + optional Gemini pass used by the website. */
export async function analyzeChannelText(text: string): Promise<AnalysisResult> {
  const result = analyzeMessage(text);
  return enrichResult(result, { inputType: "message", text });
}

export const CHANNEL_MAX_INPUT = 4_000;
export const CHANNEL_MAX_REPLY = 1_500;
export const TELEGRAM_MAX_REPLY = 4_000;

const SIGNAL_LIMIT: Record<ChannelName, number> = {
  sms: 3,
  telegram: 4,
  whatsapp: 4,
};

const RECOMMENDATION_LIMIT: Record<ChannelName, number> = {
  sms: 2,
  telegram: 3,
  whatsapp: 3,
};

/**
 * Plain-text reply. No markdown, links or rich formatting so the same body is
 * safe for SMS, Telegram and WhatsApp, and no submitted URL is ever re-sent as
 * a clickable link.
 */
export function formatChannelReply(
  result: AnalysisResult,
  channel: ChannelName
): string {
  const lines: string[] = [
    `FakeShield AI: ${result.riskLevel.toUpperCase()} RISK (${result.riskScore}/100)`,
    result.summary,
  ];

  if (result.otp) {
    lines.push(
      "",
      result.otp.requested
        ? "This message asks for a one-time code. Never share an OTP with anyone, even someone claiming to be your bank."
        : "A one-time code appears in this message. Never forward or read it to someone who calls you."
    );
  }

  if (result.officialDomain?.mismatch) {
    lines.push(
      "",
      `Impersonation warning: it claims to be from ${result.officialDomain.brand}, but ${result.officialDomain.observedDomain} is not its official domain (${result.officialDomain.officialDomains[0]}).`
    );
  }

  const signals = result.signals.slice(0, SIGNAL_LIMIT[channel]);
  if (signals.length > 0) {
    lines.push("", "Warning signs:");
    for (const signal of signals) {
      const evidence = signal.evidence ? ` (${signal.evidence.slice(0, 90)})` : "";
      lines.push(`- ${signal.label}${evidence}`);
    }
  }

  const recommendations = result.recommendations.slice(0, RECOMMENDATION_LIMIT[channel]);
  if (recommendations.length > 0) {
    lines.push("", "What to do:");
    for (const recommendation of recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }

  lines.push(
    "",
    "FakeShield AI provides risk guidance, not a final security verdict. Verify money or credential requests through an official channel."
  );

  const max = channel === "telegram" ? TELEGRAM_MAX_REPLY : CHANNEL_MAX_REPLY;
  const text = lines.join("\n");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 28).trimEnd()}\n\n[Reply shortened]`;
}

export function channelGreeting(channel: ChannelName): string {
  const scope =
    channel === "sms"
      ? "Text any suspicious message to this number"
      : channel === "telegram"
        ? "Forward any suspicious message to this bot"
        : "Send any suspicious message to this WhatsApp number";
  return `${scope} and I will reply with a risk score, the warning signs and what to do next. Never send passwords, PINs or OTPs. FakeShield AI provides risk guidance, not a final security verdict.`;
}

export function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized === "/start" ||
    normalized === "/help" ||
    normalized === "help" ||
    normalized === "hi" ||
    normalized === "hello"
  );
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
