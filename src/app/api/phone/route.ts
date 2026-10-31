import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { phoneIntelSeeds } from "@/lib/data/phone-intel";
import {
  formatPhone,
  isValidPhone,
  normalizePhone,
  parseCategories,
  phoneChecks,
  PHONE_REPORT_CATEGORIES,
  riskFromReports,
  type PhoneLookup,
} from "@/lib/phone";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getSessionId, jsonError, NO_STORE_HEADERS, zodError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const seededNumbers = new Set(phoneIntelSeeds.map((seed) => seed.number));

const reportSchema = z.object({
  number: z.string().trim().min(4).max(30),
  category: z.enum(PHONE_REPORT_CATEGORIES),
  note: z.string().trim().max(240).optional(),
});

function notFoundLookup(normalized: string): PhoneLookup {
  return {
    number: normalized,
    display: formatPhone(normalized),
    valid: true,
    found: false,
    reportCount: 0,
    riskLevel: "Low",
    categories: [],
    summary:
      "No reports for this number in the demo community dataset. That is not proof that the number is safe.",
    lastReportedAt: null,
    source: "none",
    demo: true,
    checks: phoneChecks(normalized),
  };
}

export async function GET(request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const limit = rateLimit(`phone:${sessionId}`, 40, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const raw = new URL(request.url).searchParams.get("number") ?? "";
  const normalized = normalizePhone(raw);
  if (!isValidPhone(normalized)) {
    return jsonError("Enter a phone number with 8 to 15 digits, including the country code if known.", 422);
  }

  try {
    const row = await prisma.phoneIntel.findUnique({ where: { number: normalized } });
    if (!row) {
      return NextResponse.json(notFoundLookup(normalized), { headers: NO_STORE_HEADERS });
    }

    const lookup: PhoneLookup = {
      number: row.number,
      display: formatPhone(row.number),
      valid: true,
      found: true,
      reportCount: row.reportCount,
      riskLevel: (row.riskLevel as PhoneLookup["riskLevel"]) ?? riskFromReports(row.reportCount),
      categories: parseCategories(row.categories),
      summary: row.summary,
      lastReportedAt: row.lastReportedAt.toISOString(),
      source: seededNumbers.has(row.number) ? "seeded" : "live",
      demo: true,
      checks: phoneChecks(row.number),
    };

    return NextResponse.json(lookup, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Phone lookup failed:", error);
    return jsonError("The phone dataset could not be reached. Try again in a moment.", 500);
  }
}

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const limit = rateLimit(`phone-report:${sessionId}`, 6, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const normalized = normalizePhone(parsed.data.number);
  if (!isValidPhone(normalized)) {
    return jsonError("Enter a phone number with 8 to 15 digits.", 422);
  }

  try {
    const existing = await prisma.phoneIntel.findUnique({ where: { number: normalized } });
    const now = new Date();

    let categories: Record<string, number> = {};
    if (existing) {
      try {
        categories = JSON.parse(existing.categories) as Record<string, number>;
      } catch {
        categories = {};
      }
    }
    categories[parsed.data.category] = (categories[parsed.data.category] ?? 0) + 1;

    const reportCount = (existing?.reportCount ?? 0) + 1;
    const riskLevel = riskFromReports(reportCount);
    const summary = existing?.summary
      ? existing.summary
      : `New local report for ${parsed.data.category.toLowerCase()}. Community reports are unverified and may be mistaken.`;

    const [, row] = await prisma.$transaction([
      prisma.phoneReport.create({
        data: {
          number: normalized,
          category: parsed.data.category,
          note: parsed.data.note || null,
        },
      }),
      prisma.phoneIntel.upsert({
        where: { number: normalized },
        update: {
          reportCount,
          riskLevel,
          categories: JSON.stringify(categories),
          lastReportedAt: now,
        },
        create: {
          number: normalized,
          reportCount,
          riskLevel,
          categories: JSON.stringify(categories),
          summary,
          lastReportedAt: now,
        },
      }),
    ]);

    const lookup: PhoneLookup = {
      number: row.number,
      display: formatPhone(row.number),
      valid: true,
      found: true,
      reportCount: row.reportCount,
      riskLevel: (row.riskLevel as PhoneLookup["riskLevel"]) ?? riskLevel,
      categories: parseCategories(row.categories),
      summary: row.summary,
      lastReportedAt: row.lastReportedAt.toISOString(),
      source: seededNumbers.has(row.number) ? "seeded" : "live",
      demo: true,
      checks: phoneChecks(row.number),
    };

    return NextResponse.json(lookup, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Phone report failed:", error);
    return jsonError("Your report could not be saved. Try again.", 500);
  }
}
