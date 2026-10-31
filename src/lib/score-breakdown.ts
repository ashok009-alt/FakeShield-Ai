import type { AnalysisResult, RiskLevel, Signal } from "./analysis/types";
import { RISK_THRESHOLDS } from "./analysis/types";
import { SEVERITY_RANK } from "./analysis/signalExplanations";

export const CATEGORY_LABEL: Record<string, string> = {
  urgency: "Urgency",
  fear: "Threats & fear",
  financial: "Financial lure",
  credentials: "Credentials",
  impersonation: "Impersonation",
  request: "Direct request",
  formatting: "Formatting",
  pattern: "Known pattern",
  sender: "Sender identity",
  link: "Link",
  domain: "Domain",
};

export interface BreakdownBonus {
  label: string;
  points: number;
  applied: boolean;
  detail: string;
}

export interface BreakdownCategory {
  id: string;
  label: string;
  count: number;
  weight: number;
}

export interface HybridBreakdown {
  status: "ok" | "cached";
  model: string;
  semanticScore: number;
  ruleScore: number;
  blended: number;
  floor: number;
  final: number;
  floorApplied: boolean;
  semanticConfidence?: number;
}

export interface ScoreBreakdown {
  score: number;
  level: RiskLevel;
  signals: Signal[];
  signalCount: number;
  rawWeight: number;
  base: number;
  criticalCount: number;
  highCount: number;
  categoryCount: number;
  bonuses: BreakdownBonus[];
  bonusTotal: number;
  computedScore: number;
  categories: BreakdownCategory[];
  confidence: number;
  confidenceComputed: number;
  confidenceFactors: string[];
  /** Present when Gemini contributed a semantic score. */
  hybrid?: HybridBreakdown;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Mirrors the engine's scoring arithmetic exactly (riskScoring.ts):
 * a saturating curve over signal weights, plus severity/category bonuses.
 * Used by the explainer dialog so judges can see every point accounted for.
 */
export function buildScoreBreakdown(
  result: Pick<AnalysisResult, "signals" | "riskScore" | "riskLevel" | "confidence" | "llm">,
  inputLength?: number
): ScoreBreakdown {
  const unique = new Map<string, Signal>();
  for (const signal of result.signals) {
    if (!unique.has(signal.id)) unique.set(signal.id, signal);
  }
  const signals = [...unique.values()];

  const rawWeight = signals.reduce((total, signal) => total + signal.weight, 0);
  const criticalCount = signals.filter((signal) => signal.severity === "critical").length;
  const highCount = signals.filter((signal) => signal.severity === "high").length;
  const categoryIds = new Set(signals.map((signal) => signal.category));
  const categoryCount = categoryIds.size;

  const base = rawWeight > 0 ? 100 * (1 - Math.exp(-rawWeight / 40)) : 0;
  const bonuses: BreakdownBonus[] = [
    {
      label: "Critical signal present",
      points: 8,
      applied: criticalCount > 0,
      detail: `${criticalCount} critical`,
    },
    {
      label: "Three or more high signals",
      points: 5,
      applied: highCount >= 3,
      detail: `${highCount} high`,
    },
    {
      label: "Four or more categories",
      points: 3,
      applied: categoryCount >= 4,
      detail: `${categoryCount} categories`,
    },
  ];
  const bonusTotal = bonuses.reduce((total, bonus) => total + (bonus.applied ? bonus.points : 0), 0);
  const computedScore =
    rawWeight > 0 ? Math.min(100, Math.round(base + bonusTotal)) : 0;

  const categories: BreakdownCategory[] = [...categoryIds]
    .map((id) => {
      const group = signals.filter((signal) => signal.category === id);
      return {
        id,
        label: CATEGORY_LABEL[id] ?? id,
        count: group.length,
        weight: group.reduce((total, signal) => total + signal.weight, 0),
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const strongest = [...signals].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
  )[0];
  const maxSeverity = strongest?.severity ?? null;

  let confidenceComputed: number;
  if (signals.length === 0) {
    confidenceComputed = 0.55;
  } else {
    confidenceComputed =
      0.5 +
      0.045 * Math.min(signals.length, 7) +
      0.07 * Math.min(categoryCount, 3) +
      (maxSeverity === "critical"
        ? 0.04
        : maxSeverity === "high" || SEVERITY_RANK[maxSeverity ?? "low"] >= 3
          ? 0.02
          : 0);
  }

  const factors: string[] = [
    signals.length === 0
      ? "No signals fired, so the baseline 55% confidence applies."
      : "Baseline 50% before evidence is counted.",
  ];

  if (signals.length > 0) {
    factors.push(
      `+${(0.045 * Math.min(signals.length, 7) * 100).toFixed(1)}% from ${Math.min(
        signals.length,
        7
      )} signal${signals.length === 1 ? "" : "s"} (max 7 counted).`
    );
    factors.push(
      `+${(0.07 * Math.min(categoryCount, 3) * 100).toFixed(1)}% from ${Math.min(
        categoryCount,
        3
      )} categor${categoryCount === 1 ? "y" : "ies"} (max 3 counted).`
    );
    if (maxSeverity === "critical") factors.push("+4% because the strongest signal is critical.");
    else if (maxSeverity === "high") factors.push("+2% because the strongest signal is high.");
  }

  if (inputLength !== undefined && inputLength < 40) {
    confidenceComputed = Math.min(confidenceComputed, 0.62);
    factors.push("Capped at 62% because the input is very short.");
  }

  confidenceComputed = clamp(confidenceComputed, 0.5, 0.95);

  let hybrid: HybridBreakdown | undefined;
  const llm = result.llm;
  if (
    llm &&
    (llm.status === "ok" || llm.status === "cached") &&
    typeof llm.semanticScore === "number"
  ) {
    const ruleScore = llm.ruleScore ?? computedScore;
    const blended = Math.round(0.55 * llm.semanticScore + 0.45 * ruleScore);
    const floor = Math.max(0, ruleScore - 20);
    const final = Math.min(100, Math.max(floor, blended));
    hybrid = {
      status: llm.status,
      model: llm.model,
      semanticScore: llm.semanticScore,
      ruleScore,
      blended,
      floor,
      final,
      floorApplied: blended < floor,
      semanticConfidence: llm.confidence,
    };
  }

  return {
    score: result.riskScore,
    level: result.riskLevel,
    signals,
    signalCount: signals.length,
    rawWeight,
    base,
    criticalCount,
    highCount,
    categoryCount,
    bonuses,
    bonusTotal,
    computedScore,
    categories,
    confidence: result.confidence,
    confidenceComputed: Math.round(confidenceComputed * 100) / 100,
    confidenceFactors: factors,
    hybrid,
  };
}

export { RISK_THRESHOLDS };
