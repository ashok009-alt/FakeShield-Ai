import { prisma } from "./db";
import { serializeAnalysis, type StoredAnalysis } from "./serialize";
import type { AnalysisResult } from "./analysis/types";

export async function saveAnalysis(
  result: AnalysisResult,
  sessionId: string,
  rawInput: string
): Promise<StoredAnalysis> {
  const row = await prisma.analysis.create({
    data: {
      sessionId,
      inputType: result.inputType,
      rawInput,
      meta:
        result.email ||
        result.url ||
        result.safeBrowsing ||
        result.domainIntel ||
        result.language ||
        result.llm ||
        result.officialDomain ||
        result.otp ||
        result.threatIntel ||
        result.breach
          ? JSON.stringify({
              email: result.email ?? null,
              url: result.url ?? null,
              safeBrowsing: result.safeBrowsing ?? null,
              domainIntel: result.domainIntel ?? null,
              language: result.language ?? null,
              llm: result.llm ?? null,
              officialDomain: result.officialDomain ?? null,
              otp: result.otp ?? null,
              threatIntel: result.threatIntel ?? null,
              breach: result.breach ?? null,
            })
          : null,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      summary: result.summary,
      signals: JSON.stringify(result.signals),
      extracted: JSON.stringify(result.extracted),
      recommendations: JSON.stringify(result.recommendations),
      threatFeed: result.threatFeed,
    },
  });

  return serializeAnalysis(row);
}

export async function attachReport(
  result: AnalysisResult,
  sessionId: string,
  rawInput: string
): Promise<AnalysisResult> {
  try {
    const stored = await saveAnalysis(result, sessionId, rawInput);
    return { ...result, id: stored.id, createdAt: stored.createdAt };
  } catch (error) {
    console.error("Failed to persist analysis:", error);
    return result;
  }
}
