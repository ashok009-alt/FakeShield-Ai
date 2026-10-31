import type { Signal } from "./analysis/types";

/** Signal weights used only for the forward-chain likelihood meter. */
const CHAIN_WEIGHTS: Record<string, number> = {
  forwarded_many: 30,
  forward_chain_request: 30,
  viral_panic: 18,
  chain_blessing: 10,
  unverified_forward: 12,
};

export const FORWARD_SIGNAL_IDS = new Set(Object.keys(CHAIN_WEIGHTS));

export interface ChainAssessment {
  score: number;
  label: "No chain markers" | "Some forward traits" | "Likely forward chain" | "Heavy chain pattern";
  explanation: string;
  markerCount: number;
}

export function computeForwardChain(signals: Signal[]): ChainAssessment {
  const markers = signals.filter((signal) => FORWARD_SIGNAL_IDS.has(signal.id));
  const score = Math.min(
    100,
    markers.reduce((total, signal) => total + (CHAIN_WEIGHTS[signal.id] ?? 0), 0)
  );

  if (score === 0) {
    return {
      score: 0,
      label: "No chain markers",
      explanation:
        "This text does not use typical forward-chain wording. That does not guarantee the source is genuine.",
      markerCount: 0,
    };
  }
  if (score < 35) {
    return {
      score,
      label: "Some forward traits",
      explanation:
        "A few forward-style phrases are present. It may be a normal message that was passed on, but the origin is getting harder to see.",
      markerCount: markers.length,
    };
  }
  if (score < 70) {
    return {
      score,
      label: "Likely forward chain",
      explanation:
        "The wording matches messages designed to travel through groups. Find the original source before you trust or share it.",
      markerCount: markers.length,
    };
  }
  return {
    score,
    label: "Heavy chain pattern",
    explanation:
      "This is a classic chain message: it asks for sharing and uses pressure to keep moving. Its claims are not verified by the fact that many people forwarded it.",
    markerCount: markers.length,
  };
}
