import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { buildStats } from "@/lib/serialize";
import { getSessionId, jsonError, NO_STORE_HEADERS } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const limit = rateLimit(`stats:${sessionId}`, 120, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  try {
    // Select only the aggregation columns: raw inputs can be long and are not
    // needed to compute counts, averages or the signal leaderboard.
    const rows = await prisma.analysis.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        riskLevel: true,
        inputType: true,
        confidence: true,
        signals: true,
        createdAt: true,
      },
    });

    return NextResponse.json(buildStats(rows), { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Stats fetch failed:", error);
    return jsonError("Could not load analytics.", 500);
  }
}
