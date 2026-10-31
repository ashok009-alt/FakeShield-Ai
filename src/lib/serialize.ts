import type { Analysis as AnalysisRow } from "@prisma/client";
import type {
  AnalysisResult,
  BreachResult,
  DomainIntel,
  EmailMeta,
  InputType,
  LanguageMeta,
  LlmAnalysis,
  OfficialDomainCheck,
  OtpExposure,
  RiskLevel,
  UrlDetails,
  UrlThreatIntel,
} from "./analysis/types";
import type { SafeBrowsingResult } from "./analysis/types";

export interface StoredAnalysis extends AnalysisResult {
  id: string;
  rawInput: string;
  createdAt: string;
  meta?: EmailMeta | null;
}

export interface HistoryFilters {
  level?: string;
  type?: string;
}

export interface DailyScan {
  date: string;
  label: string;
  count: number;
}

export interface StatsResponse {
  totalScans: number;
  highRiskCount: number;
  averageConfidence: number;
  mostCommonSignal: { id: string; label: string; count: number } | null;
  byLevel: Record<RiskLevel, number>;
  byType: Record<InputType, number>;
  daily: DailyScan[];
  lastScanAt: string | null;
}

const EMPTY_LEVELS: Record<RiskLevel, number> = {
  Low: 0,
  Medium: 0,
  High: 0,
  Critical: 0,
};

const EMPTY_TYPES: Record<InputType, number> = {
  message: 0,
  email: 0,
  url: 0,
};

export function serializeAnalysis(row: AnalysisRow): StoredAnalysis {
  let meta: EmailMeta | null = null;
  let url: UrlDetails | undefined;
  let safeBrowsing: SafeBrowsingResult | undefined;
  let domainIntel: DomainIntel | undefined;
  let language: LanguageMeta | undefined;
  let llm: LlmAnalysis | undefined;
  let officialDomain: OfficialDomainCheck | undefined;
  let otp: OtpExposure | undefined;
  let threatIntel: UrlThreatIntel | undefined;
  let breach: BreachResult | undefined;

  if (row.meta) {
    try {
      const parsed = JSON.parse(row.meta) as {
        email?: EmailMeta;
        url?: UrlDetails;
        safeBrowsing?: SafeBrowsingResult;
        domainIntel?: DomainIntel;
        language?: LanguageMeta;
        llm?: LlmAnalysis;
        officialDomain?: OfficialDomainCheck;
        otp?: OtpExposure;
        threatIntel?: UrlThreatIntel;
        breach?: BreachResult;
      };
      meta = parsed.email ?? null;
      url = parsed.url;
      safeBrowsing = parsed.safeBrowsing;
      domainIntel = parsed.domainIntel;
      language = parsed.language;
      llm = parsed.llm ?? undefined;
      officialDomain = parsed.officialDomain ?? undefined;
      otp = parsed.otp ?? undefined;
      threatIntel = parsed.threatIntel ?? undefined;
      breach = parsed.breach ?? undefined;
    } catch {
      meta = null;
    }
  }

  return {
    id: row.id,
    inputType: row.inputType as InputType,
    rawInput: row.rawInput,
    riskScore: row.riskScore,
    riskLevel: row.riskLevel as RiskLevel,
    confidence: row.confidence,
    summary: row.summary,
    signals: safeParse(row.signals, []),
    extracted: safeParse(row.extracted, {
      urls: [],
      phoneNumbers: [],
      emails: [],
      paymentKeywords: [],
      urgencyPhrases: [],
      amounts: [],
      brands: [],
      attachments: [],
    }),
    recommendations: safeParse(row.recommendations, []),
    disclaimer:
      "FakeShield AI provides risk guidance, not a final security verdict.",
    threatFeed: row.threatFeed === "verified" ? "verified" : "heuristic",
    createdAt: row.createdAt.toISOString(),
    meta,
    email: meta ?? undefined,
    url,
    safeBrowsing,
    domainIntel,
    language,
    llm,
    officialDomain,
    otp,
    threatIntel,
    breach,
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Only the columns the stats aggregation needs — avoids shipping raw inputs. */
export type StatsRow = Pick<
  AnalysisRow,
  "riskLevel" | "inputType" | "confidence" | "signals" | "createdAt"
>;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function buildStats(rows: StatsRow[]): StatsResponse {
  const byLevel: Record<RiskLevel, number> = { ...EMPTY_LEVELS };
  const byType: Record<InputType, number> = { ...EMPTY_TYPES };
  const signalCounts = new Map<string, { label: string; count: number }>();
  let confidenceTotal = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pre-fill the seven day buckets, then tally in one pass over the rows.
  const days: { key: string; date: string; label: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push({
      key: dayKey(day),
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-IN", { weekday: "short" }),
      count: 0,
    });
  }
  const dayIndex = new Map(days.map((day, index) => [day.key, index]));

  for (const row of rows) {
    const level = row.riskLevel as RiskLevel;
    if (byLevel[level] !== undefined) byLevel[level] += 1;
    const type = row.inputType as InputType;
    if (byType[type] !== undefined) byType[type] += 1;
    confidenceTotal += row.confidence;

    const bucket = dayIndex.get(dayKey(new Date(row.createdAt)));
    if (bucket !== undefined) days[bucket].count += 1;

    try {
      const signals = JSON.parse(row.signals) as { id: string; label: string }[];
      for (const signal of signals) {
        const existing = signalCounts.get(signal.id);
        if (existing) {
          existing.count += 1;
        } else {
          signalCounts.set(signal.id, { label: signal.label, count: 1 });
        }
      }
    } catch {
      /* ignore malformed rows */
    }
  }

  const mostCommonSignal =
    [...signalCounts.entries()]
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    totalScans: rows.length,
    highRiskCount: byLevel.High + byLevel.Critical,
    averageConfidence:
      rows.length > 0 ? Math.round((confidenceTotal / rows.length) * 100) / 100 : 0,
    mostCommonSignal,
    byLevel,
    byType,
    daily: days.map(({ date, label, count }) => ({ date, label, count })),
    lastScanAt: rows[0]?.createdAt.toISOString() ?? null,
  };
}
