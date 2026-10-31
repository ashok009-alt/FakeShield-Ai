import type { AnalysisResult } from "./analysis/types";
import { INPUT_TYPE_LABEL } from "./constants";

export function buildShareSummary(result: AnalysisResult): string {
  const lines: string[] = [
    `FakeShield AI — ${result.riskLevel} risk (${result.riskScore}/100), ${Math.round(
      result.confidence * 100
    )}% confidence`,
    result.summary,
    "",
  ];

  if (result.otp?.requested) {
    lines.push(
      "WARNING: This message asks for a one-time code. Never share an OTP with anyone — not even someone claiming to be your bank.",
      ""
    );
  }
  if (result.officialDomain?.mismatch) {
    lines.push(
      `WARNING: It claims to be ${result.officialDomain.brand} but uses ${result.officialDomain.observedDomain}, which is not an official domain.`,
      ""
    );
  }

  if (result.signals.length > 0) {
    lines.push("Warning signs:");
    for (const signal of result.signals.slice(0, 8)) {
      lines.push(`- ${signal.label}${signal.evidence ? ` (“${signal.evidence}”)` : ""}`);
    }
    lines.push("");
  }

  if (result.recommendations.length > 0) {
    lines.push("What to do next:");
    for (const recommendation of result.recommendations) {
      lines.push(`- ${recommendation}`);
    }
    lines.push("");
  }

  lines.push(
    `${INPUT_TYPE_LABEL[result.inputType] ?? "Input"} checked with FakeShield AI. Risk guidance, not a final security verdict.`
  );

  return lines.join("\n");
}

export function reportFilename(result: AnalysisResult): string {
  const stamp = new Date(result.createdAt ?? Date.now()).toISOString().replace(/[:.]/g, "-");
  return `fakeshield-${result.inputType}-${stamp}.json`;
}

export function reportPath(result: AnalysisResult): string | null {
  return result.id ? `/report/${result.id}` : null;
}
