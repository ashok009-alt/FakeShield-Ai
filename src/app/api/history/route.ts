import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { serializeAnalysis } from "@/lib/serialize";
import {
  getSessionId,
  jsonError,
  historyQuerySchema,
  NO_STORE_HEADERS,
  zodError,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const limit = rateLimit(`history:${sessionId}`, 120, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const url = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    level: url.searchParams.get("level") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsed.success) return zodError(parsed.error);

  const where = {
    sessionId,
    ...(parsed.data.level ? { riskLevel: parsed.data.level } : {}),
    ...(parsed.data.type ? { inputType: parsed.data.type } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.analysis.count({ where }),
    ]);

    return NextResponse.json(
      {
        analyses: rows.map(serializeAnalysis),
        total,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("History fetch failed:", error);
    return jsonError("Could not load analysis history.", 500);
  }
}
