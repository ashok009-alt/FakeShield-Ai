import { extractEntities } from "./extract";
import { computeForwardChain } from "../forward";
import { collectMessageSignals } from "./messageAnalyzer";
import { buildAssessment } from "./riskScoring";
import { makeSignal } from "./signalExplanations";
import { DISCLAIMER, type AnalysisResult, type Signal } from "./types";

interface ForwardRule {
  id: string;
  pattern: RegExp;
}

const FORWARD_RULES: ForwardRule[] = [
  {
    id: "forwarded_many",
    pattern:
      /\b(forwarded many times|forwarded message|fwd\s*[:：]|forwarded\s+as\s+received|forward as received|forwarded from)\b/i,
  },
  {
    id: "forward_chain_request",
    pattern:
      /\b(forward (this|it|the message)?\s*to (at least )?\d+|share (this|it|the message)?\s*with (at least )?\d+ (people|friends|groups|contacts)|send (this|it|the message)?\s*to \d+ (people|friends|groups|contacts)|circulate (this|it)|copy (this|it) (and|&) (paste|send))\b/i,
  },
  {
    id: "viral_panic",
    pattern:
      /\b(do not ignore|don'?t ignore|must read|must share|urgent (notice|message|information) (for|to) (all|everyone)|important (message|notice|information) (for|to) (all|everyone)|breaking news|before it (is|gets) deleted|share before|forward before)\b/i,
  },
  {
    id: "chain_blessing",
    pattern:
      /\b(good morning|blessings?|bhagwan|rab rakha|jai shri|do not break the chain|chain message|forward this to (10|ten|5|five) (people|friends)|share with (10|ten) (people|friends))\b/i,
  },
  {
    id: "unverified_forward",
    pattern:
      /\b(as received|source\s*:?\s*(whatsapp|forward|social media)|received on whatsapp|viral (message|video|news)|according to (a )?(forward|whatsapp) (message|forward)|someone forwarded)\b/i,
  },
];

export function collectForwardSignals(text: string): Signal[] {
  const signals: Signal[] = [];
  for (const rule of FORWARD_RULES) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    const signal = makeSignal(rule.id, match[0]);
    if (signal) signals.push(signal);
  }
  return signals;
}

/**
 * Forward-aware variant of the message analyzer. The underlying scam engine is
 * unchanged; forward-chain markers are added as their own signals so the UI can
 * separate "spread risk" from "scam risk".
 */
export function analyzeForward(text: string): AnalysisResult {
  const trimmed = text.trim();
  const forwardSignals = collectForwardSignals(trimmed);
  const scamSignals = collectMessageSignals(trimmed);
  const signals = [...scamSignals, ...forwardSignals];
  const extracted = extractEntities(trimmed);
  const chain = computeForwardChain(forwardSignals);
  const scamWeight = scamSignals.reduce((total, signal) => total + signal.weight, 0);

  const assessment = buildAssessment({
    inputType: "message",
    signals,
    extracted,
    textLength: trimmed.length,
    familyOverride: assessmentFamily(chain.score, scamWeight),
  });

  const scamCount = scamSignals.length;
  let summary = assessment.summary;

  if (chain.score === 0) {
    summary =
      "No forward-chain markers were found. That does not guarantee the message is genuine — check any request for money, codes or personal details.";
  } else if (assessment.riskScore >= 50) {
    summary = `${assessment.summary} It also carries forward-chain markers, so do not pass it on.`;
  } else if (chain.score >= 35 && scamCount === 0) {
    summary =
      "This reads like a viral forward chain. No strong scam markers were found, but the original source is unclear — verify it before sharing.";
  } else if (chain.score >= 35) {
    summary = `${assessment.summary} The message also shows forward-chain traits, which make its origin harder to verify.`;
  } else if (scamCount === 0) {
    summary =
      "A few forward-style phrases are present, but no strong scam markers. Treat the claim as unverified until you find the original source.";
  }

  const recommendations = [...assessment.recommendations];
  if (chain.score >= 35) {
    const advice = "Trace the claim to a named official source before you forward it.";
    if (!recommendations.includes(advice)) recommendations.unshift(advice);
  }
  if (chain.score >= 70) {
    recommendations.push("If you already forwarded it, send a short correction to the same groups.");
  }

  return {
    ...assessment,
    summary,
    recommendations: recommendations.slice(0, 6),
    inputType: "message",
    extracted,
    disclaimer: DISCLAIMER,
  };
}

function assessmentFamily(chainScore: number, rawScamWeight: number): string {
  if (rawScamWeight >= 20) return "a scam message travelling through forwards";
  if (chainScore >= 35) return "a viral forward chain with an unverifiable source";
  return "a forwarded message";
}
