import type { AnalysisResult } from "./analysis/types";
import { INPUT_TYPE_LABEL } from "./constants";

const CYBERCRIME_URL = "https://cybercrime.gov.in";
const HELPLINE = "1930";

export { CYBERCRIME_URL, HELPLINE };

/**
 * Builds a plain-text complaint draft the user can review, copy or attach to a
 * cybercrime.gov.in report. FakeShield never submits it and never asks for the
 * personal details that belong in the portal itself.
 */
export function buildComplaintDraft(result: AnalysisResult, generatedAt = new Date()): string {
  const date = generatedAt.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const { extracted } = result;
  const lines: string[] = [];

  lines.push("CYBER FRAUD COMPLAINT DRAFT");
  lines.push(`Prepared with FakeShield AI on ${date}`);
  lines.push("This is a draft, not a filed complaint. FakeShield provides risk guidance, not a legal finding.");
  lines.push("");
  lines.push("1. WHAT HAPPENED");
  lines.push(
    `I received a suspicious ${INPUT_TYPE_LABEL[result.inputType]?.toLowerCase() ?? "message"} that FakeShield AI assessed as ${result.riskLevel.toLowerCase()} risk (${result.riskScore}/100).`
  );
  lines.push(
    "[Add 2–4 sentences in your own words: what they asked for, whether you clicked, paid or shared anything, and how much money was lost.]"
  );
  lines.push("");
  lines.push("2. WARNING SIGNS IDENTIFIED");
  if (result.signals.length > 0) {
    for (const signal of result.signals.slice(0, 8)) {
      const evidence = signal.evidence
        ? ` — “${signal.evidence.replace(/\s+/g, " ").trim().slice(0, 140)}”`
        : "";
      lines.push(`- ${signal.label} (${signal.severity} severity)${evidence}`);
    }
  } else {
    lines.push("- No named warning signs fired; the complaint should rely on the original evidence.");
  }
  lines.push("");
  lines.push("3. INDICATORS TO ATTACH (do not click any link)");
  appendList(lines, "Links", extracted.urls);
  appendList(lines, "Phone numbers", extracted.phoneNumbers);
  appendList(lines, "Email addresses", extracted.emails);
  appendList(lines, "UPI / payment terms", extracted.paymentKeywords);
  appendList(
    lines,
    "Amounts mentioned",
    extracted.amounts.length > 0 ? extracted.amounts : []
  );
  if (
    extracted.urls.length + extracted.phoneNumbers.length + extracted.emails.length === 0
  ) {
    lines.push("- No machine-extracted indicators were found. Include screenshots of the original message.");
  }
  if (result.url) {
    lines.push(`- Domain in the link: ${result.url.registrableDomain}`);
    if (result.domainIntel?.status === "ok" && typeof result.domainIntel.ageDays === "number") {
      lines.push(`- Domain registration age at check time: ${result.domainIntel.ageDays} days`);
    }
  }
  if (result.email) {
    lines.push(`- From address: ${result.email.fromEmail}`);
    if (result.email.replyTo) lines.push(`- Reply-To address: ${result.email.replyTo}`);
    if (result.email.subject) lines.push(`- Subject: ${result.email.subject}`);
  }
  lines.push("");
  lines.push("4. EVIDENCE TO KEEP");
  lines.push("- Screenshots of the message, caller ID, email headers and any payment receipts.");
  lines.push("- Bank statement entries or UPI transaction IDs for the disputed transfer.");
  lines.push("- Do not delete the chat or email; keep a second copy with a trusted person.");
  lines.push("");
  lines.push("5. ACTION REQUESTED");
  lines.push("- Register a complaint under the appropriate cyber-fraud category on cybercrime.gov.in.");
  lines.push(
    `- If money was debited, call the national financial-fraud helpline ${HELPLINE} immediately and ask your bank to flag the transaction.`
  );
  lines.push("- Preserve the original message; do not send money to “recover” the lost amount.");
  lines.push("");
  lines.push("6. COMPLAINANT DETAILS");
  lines.push("Fill these in on the portal — FakeShield does not collect them.");
  lines.push("Full name: ______________________");
  lines.push("Mobile number: __________________");
  lines.push("State / city: ____________________");
  lines.push("");
  lines.push(`Portal: ${CYBERCRIME_URL} · Financial-fraud helpline: ${HELPLINE}`);
  lines.push(`FakeShield reference: ${result.id ?? "not saved (run the analysis again to receive a reference)"}`);

  return lines.join("\n");
}

function appendList(lines: string[], label: string, values: string[]): void {
  if (values.length === 0) return;
  lines.push(`${label}: ${values.slice(0, 6).join(", ")}`);
}

export function complaintFilename(result: AnalysisResult): string {
  const stamp = new Date(result.createdAt ?? Date.now()).toISOString().slice(0, 10);
  return `fakeshield-complaint-${result.inputType}-${stamp}.txt`;
}
