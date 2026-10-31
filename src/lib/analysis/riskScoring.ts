import { SEVERITY_RANK, sortSignals } from "./signalExplanations";
import type {
  AnalysisResult,
  ExtractedEntities,
  InputType,
  RiskLevel,
  Severity,
  Signal,
  ThreatFeedStatus,
} from "./types";

const FAMILIES: { label: string; ids: string[] }[] = [
  {
    label: "a credential-phishing attempt",
    ids: [
      "otp_request",
      "credential_request",
      "verify_identity",
      "reset_password",
      "share_details",
      "kyc_request",
      "fake_kyc_pattern",
      "sender_lookalike_domain",
    ],
  },
  {
    label: "an investment or crypto scam",
    ids: ["investment_bait", "investment_group_pattern", "gift_card_request"],
  },
  {
    label: "a fake delivery-fee scam",
    ids: ["delivery_fee_pattern", "delivery_reference"],
  },
  {
    label: "a fake job offer",
    ids: ["job_offer_pattern"],
  },
  {
    label: "a prize or lottery scam",
    ids: ["prize_bait", "prize_pattern"],
  },
  {
    label: "a fake tech-support scam",
    ids: ["support_scam_pattern", "remote_access", "install_app"],
  },
  {
    label: "a bank-impersonation scam",
    ids: [
      "bank_alert_pattern",
      "account_threat",
      "fraud_alert",
      "bank_reference",
      "sender_free_domain",
      "sender_domain_mismatch",
    ],
  },
  {
    label: "an identity-impersonation attempt",
    ids: ["gov_reference", "police_reference", "secrecy_request", "legal_threat"],
  },
  {
    label: "a phishing-style message",
    ids: [
      "link_lookalike",
      "link_brand_subdomain",
      "link_shortener",
      "link_suspicious_domain",
      "url_lookalike",
      "url_brand_subdomain",
      "url_shortener",
      "url_ip",
      "email_security_alert",
      "spoofed_brand_subject",
    ],
  },
];

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pickFamily(signals: Signal[]): string {
  let bestLabel = "a phishing-style message";
  let bestScore = 0;

  for (const family of FAMILIES) {
    const familyScore = signals
      .filter((signal) => family.ids.includes(signal.id))
      .reduce((total, signal) => total + signal.weight, 0);
    if (familyScore > bestScore) {
      bestScore = familyScore;
      bestLabel = family.label;
    }
  }

  return bestLabel;
}

function buildSummary(
  inputType: InputType,
  signals: Signal[],
  score: number,
  familyOverride?: string
): string {
  const subject =
    inputType === "email" ? "This email" : inputType === "url" ? "This link" : "This message";
  const family = familyOverride ?? pickFamily(signals);

  if (signals.length === 0) {
    if (inputType === "url") {
      return "No major warning signs were found in this link. That is not a guarantee that the site is safe.";
    }
    return `No major warning signs were found in this ${
      inputType === "email" ? "email" : "message"
    }. That does not guarantee it is genuine.`;
  }

  if (score >= 75) {
    return `${subject} shows several strong signs of ${family}.`;
  }
  if (score >= 50) {
    return `${subject} shows multiple signs of ${family} and should be treated as high risk until verified.`;
  }
  if (score >= 25) {
    return `${subject} has some warning signs that are consistent with ${family}.`;
  }
  return `${subject} has a few weak warning signs. It may be legitimate, but verify it before acting.`;
}

function buildRecommendations(signals: Signal[], score: number, inputType: InputType): string[] {
  const recommendations: string[] = [];
  const seen = new Set<string>();

  for (const signal of signals) {
    if (seen.has(signal.recommendation)) continue;
    seen.add(signal.recommendation);
    recommendations.push(signal.recommendation);
    if (recommendations.length >= 4) break;
  }

  const baseline =
    inputType === "url"
      ? "Type the address yourself or open the organisation's official app instead of following the link."
      : "Verify the request using a contact detail you find yourself — the organisation's official app or website.";

  if (!seen.has(baseline) && recommendations.length < 4) {
    recommendations.push(baseline);
    seen.add(baseline);
  }

  if (score >= 50) {
    const escalation =
      "If you already shared details or sent money, contact your bank now and report it at cybercrime.gov.in or on 1930 (India).";
    if (!seen.has(escalation)) recommendations.push(escalation);
  }

  return recommendations.slice(0, 6);
}

export interface AssessmentOptions {
  inputType: InputType;
  signals: Signal[];
  extracted: ExtractedEntities;
  threatFeed?: ThreatFeedStatus;
  textLength?: number;
  extraConfidence?: number;
  familyOverride?: string;
  summaryOverride?: string;
}

export type Assessment = Pick<
  AnalysisResult,
  "riskScore" | "riskLevel" | "confidence" | "summary" | "signals" | "recommendations" | "threatFeed"
>;

export function buildAssessment(options: AssessmentOptions): Assessment {
  const unique = new Map<string, Signal>();
  for (const signal of options.signals) {
    const existing = unique.get(signal.id);
    if (!existing) {
      unique.set(signal.id, signal);
      continue;
    }
    if (signal.evidence && !existing.evidence) {
      unique.set(signal.id, { ...existing, evidence: signal.evidence });
    }
  }

  const signals = sortSignals([...unique.values()]);
  const raw = signals.reduce((total, signal) => total + signal.weight, 0);

  const criticalCount = signals.filter((signal) => signal.severity === "critical").length;
  const highCount = signals.filter((signal) => signal.severity === "high").length;
  const categories = new Set(signals.map((signal) => signal.category)).size;

  let score = 0;
  if (raw > 0) {
    const base = 100 * (1 - Math.exp(-raw / 40));
    const bonus =
      (criticalCount > 0 ? 8 : 0) + (highCount >= 3 ? 5 : 0) + (categories >= 4 ? 3 : 0);
    score = Math.min(100, Math.round(base + bonus));
  }

  const riskLevel = riskLevelFromScore(score);

  const maxSeverity: Severity | null =
    signals.length === 0
      ? null
      : sortSignals(signals)[0].severity;

  let confidence: number;
  if (signals.length === 0) {
    confidence = 0.55;
  } else {
    confidence =
      0.5 +
      0.045 * Math.min(signals.length, 7) +
      0.07 * Math.min(categories, 3) +
      (maxSeverity === "critical"
        ? 0.04
        : maxSeverity === "high" || SEVERITY_RANK[maxSeverity ?? "low"] >= 3
          ? 0.02
          : 0);
  }

  if (options.textLength !== undefined && options.textLength < 40) {
    confidence = Math.min(confidence, 0.62);
  }

  confidence = clamp(confidence + (options.extraConfidence ?? 0), 0.5, 0.95);

  return {
    riskScore: score,
    riskLevel,
    confidence: Math.round(confidence * 100) / 100,
    summary:
      options.summaryOverride ?? buildSummary(options.inputType, signals, score, options.familyOverride),
    signals,
    recommendations: buildRecommendations(signals, score, options.inputType),
    threatFeed: options.threatFeed ?? "heuristic",
  };
}
