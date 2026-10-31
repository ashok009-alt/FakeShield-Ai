import { NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analysis/messageAnalyzer";
import { enrichResult } from "@/lib/intel/enrich";
import { attachReport } from "@/lib/persist";
import { rateLimit, rateLimitRequest, tooManyRequests } from "@/lib/rate-limit";
import {
  getSessionId,
  jsonError,
  messageSchema,
  NO_STORE_HEADERS,
  zodError,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return jsonError("Missing anonymous session. Reload the page and try again.", 400);
  }

  const ipLimit = await rateLimitRequest(request, "analyze", 10, 60_000);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfter);

  const limit = rateLimit(`analyze:${sessionId}`, 20, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const result = analyzeMessage(parsed.data.text);
    const enriched = await enrichResult(result, {
      inputType: "message",
      text: parsed.data.text,
    });
    const saved = await attachReport(enriched, sessionId, parsed.data.text);
    return NextResponse.json(saved, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Message analysis failed:", error);
    return jsonError("Analysis failed. Please try again.", 500);
  }
}
