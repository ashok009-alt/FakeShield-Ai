import type { RiskLevel, Severity } from "./analysis/types";

export const SESSION_HEADER = "x-session-id";
export const SESSION_STORAGE_KEY = "fakeshield.session.v1";
export const DISCLAIMER_TEXT =
  "FakeShield AI provides risk guidance, not a final security verdict.";

export const RISK_META: Record<
  RiskLevel,
  {
    label: string;
    ring: string;
    text: string;
    bg: string;
    border: string;
    dot: string;
    bar: string;
    description: string;
  }
> = {
  Low: {
    label: "Low risk",
    ring: "text-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
    bar: "bg-emerald-400",
    description: "Few warning signs found",
  },
  Medium: {
    label: "Medium risk",
    ring: "text-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    description: "Some warning signs — verify first",
  },
  High: {
    label: "High risk",
    ring: "text-orange-400",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    dot: "bg-orange-400",
    bar: "bg-orange-400",
    description: "Multiple strong warning signs",
  },
  Critical: {
    label: "Critical risk",
    ring: "text-red-400",
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-400",
    bar: "bg-red-400",
    description: "Do not engage with this",
  },
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  low: {
    label: "Low",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  medium: {
    label: "Medium",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  high: {
    label: "High",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    dot: "bg-orange-400",
  },
  critical: {
    label: "Critical",
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-400",
  },
};

export const INPUT_TYPE_LABEL: Record<string, string> = {
  message: "Message",
  email: "Email",
  url: "Link",
};

export function urlVerdict(score: number): { title: string; detail: string; tone: RiskLevel } {
  if (score >= 50) {
    return {
      title: "Do not visit this link",
      detail:
        "The URL has strong phishing traits. Use the organisation's official app or type its address yourself.",
      tone: "Critical",
    };
  }
  if (score >= 25) {
    return {
      title: "Proceed with caution",
      detail:
        "Some traits are unusual. Verify the domain through an independent source before entering anything.",
      tone: "Medium",
    };
  }
  return {
    title: "No major warning signs found",
    detail:
      "Nothing alarming surfaced in this check. That is not a guarantee — the site can still change or be newly malicious.",
    tone: "Low",
  };
}

export const FAQS = [
  {
    question: "Is a low risk score a guarantee that a message is safe?",
    answer:
      "No. FakeShield AI is a triage tool. It looks for known scam patterns, but a low score only means we did not find strong warning signs. New scams and well-written messages can pass. Always verify requests for money or credentials through an official channel.",
  },
  {
    question: "Does FakeShield AI open or load the links I submit?",
    answer:
      "No. Links are parsed and checked on the server. We never render a submitted URL in an iframe or visit it in a browser on your behalf. With a Google Safe Browsing key configured, the URL string is sent to Google's threat lookup API.",
  },
  {
    question: "Where is my analysis history stored?",
    answer:
      "In a local SQLite database on the server running this demo, keyed to an anonymous session ID in your browser. There is no account and no cloud sync. You can delete any analysis from the history page.",
  },
  {
    question: "What is the difference between heuristic and threat-feed verified?",
    answer:
      "Heuristic means the result comes from our rule engine: URL structure, wording, sender details and known scam patterns. Threat-feed verified means the link was also checked against Google Safe Browsing and the result is shown here. Both are guidance, not certainty.",
  },
  {
    question: "Can it detect every scam?",
    answer:
      "No system can. FakeShield AI focuses on high-signal features of common phishing, payment and impersonation scams. It can miss novel scams and can flag legitimate messages that look similar. Use the explanation, not just the score, to decide.",
  },
];
