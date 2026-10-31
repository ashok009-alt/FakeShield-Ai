import type { RiskLevel } from "./analysis/types";

export interface PhoneCheck {
  label: string;
  status: "good" | "warn" | "info";
  detail: string;
}

export interface PhoneCategory {
  name: string;
  count: number;
}

export interface PhoneLookup {
  number: string;
  display: string;
  valid: boolean;
  found: boolean;
  reportCount: number;
  riskLevel: RiskLevel;
  categories: PhoneCategory[];
  summary: string;
  lastReportedAt: string | null;
  source: "seeded" | "live" | "none";
  demo: boolean;
  checks: PhoneCheck[];
}

export const PHONE_REPORT_CATEGORIES = [
  "Fake bank / KYC",
  "OTP theft",
  "UPI / payment fraud",
  "Delivery fee",
  "Lottery / prize",
  "Job / task scam",
  "Investment / crypto",
  "Tech support / remote access",
  "Loan app harassment",
  "Other fraud",
] as const;

export type PhoneReportCategory = (typeof PHONE_REPORT_CATEGORIES)[number];

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = `+${digits.slice(1).replace(/\D/g, "")}`;
  else digits = digits.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) return digits;

  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits ? `+${digits.replace(/^\+/, "")}` : "";
}

export function isValidPhone(normalized: string): boolean {
  return /^\+\d{8,15}$/.test(normalized);
}

export function formatPhone(normalized: string): string {
  if (/^\+91\d{10}$/.test(normalized)) {
    const local = normalized.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return normalized;
}

export function phoneChecks(normalized: string): PhoneCheck[] {
  const checks: PhoneCheck[] = [];
  const digits = normalized.replace(/\D/g, "");

  if (normalized.startsWith("+91")) {
    checks.push({
      label: "Country code",
      status: "info",
      detail: "Indian number (+91). The community dataset is strongest for Indian numbers.",
    });
    const local = normalized.slice(3);
    if (/^[6-9]\d{9}$/.test(local)) {
      checks.push({
        label: "Mobile format",
        status: "good",
        detail: "Matches the standard Indian 10-digit mobile format.",
      });
    }
    if (/^900\d{7}$/.test(local)) {
      checks.push({
        label: "Premium-rate series",
        status: "warn",
        detail: "The 900 series is used for premium-rate services. Calls or messages can carry charges.",
      });
    }
    if (/^1800\d{6,7}$/.test(local)) {
      checks.push({
        label: "Toll-free format",
        status: "info",
        detail: "This looks like a toll-free number. Toll-free numbers can still be spoofed or misused.",
      });
    }
  } else {
    checks.push({
      label: "Country code",
      status: "info",
      detail: "Non-Indian number. Community coverage is limited, so absence of reports means little.",
    });
  }

  if (digits.length >= 4 && new Set(digits.slice(-4)).size === 1) {
    checks.push({
      label: "Repeated digits",
      status: "info",
      detail: "The last four digits repeat. This is common for lookalike or easy-to-remember numbers, but not proof of fraud.",
    });
  }

  return checks;
}

export function riskFromReports(count: number): RiskLevel {
  if (count >= 100) return "Critical";
  if (count >= 40) return "High";
  if (count >= 10) return "Medium";
  return "Low";
}

export function parseCategories(raw: string | null | undefined): PhoneCategory[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.entries(parsed)
      .filter(([, count]) => Number.isFinite(count) && count > 0)
      .map(([name, count]) => ({ name, count: Math.round(count) }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export function phoneVerdict(lookup: PhoneLookup): {
  headline: string;
  detail: string;
  tone: RiskLevel;
} {
  if (!lookup.found || lookup.reportCount === 0) {
    return {
      headline: "No reports in this dataset",
      detail:
        "That does not clear the number. New scam numbers appear daily, and most victims never file a report.",
      tone: "Low",
    };
  }
  if (lookup.riskLevel === "Critical" || lookup.riskLevel === "High") {
    return {
      headline: "Reported as a scam number",
      detail: `${lookup.reportCount} community reports in this demo dataset. Do not call back, pay or share codes with this number.`,
      tone: lookup.riskLevel,
    };
  }
  return {
    headline: "Some community reports",
    detail: `${lookup.reportCount} reports. Treat the number with caution and verify through an official channel.`,
    tone: "Medium",
  };
}
