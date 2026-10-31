import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { serializeAnalysis } from "@/lib/serialize";
import { getSessionId, jsonError, NO_STORE_HEADERS } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const { id } = await context.params;

  const limit = rateLimit(`report:${sessionId}`, 120, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  try {
    const row = await prisma.analysis.findFirst({ where: { id, sessionId } });
    if (!row) return jsonError("Analysis not found.", 404);
    return NextResponse.json(serializeAnalysis(row), { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Analysis fetch failed:", error);
    return jsonError("Could not load the analysis.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const { id } = await context.params;

  const limit = rateLimit(`delete:${sessionId}`, 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  try {
    const result = await prisma.analysis.deleteMany({ where: { id, sessionId } });
    if (result.count === 0) return jsonError("Analysis not found.", 404);
    return NextResponse.json({ deleted: true, id }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Analysis delete failed:", error);
    return jsonError("Could not delete the analysis.", 500);
  }
}
