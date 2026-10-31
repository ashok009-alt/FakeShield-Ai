import { NextResponse } from "next/server";
import { analyzeUrl, InvalidUrlError } from "@/lib/analysis/urlAnalyzer";
import { enrichResult } from "@/lib/intel/enrich";
import { collectUrlThreatIntel } from "@/lib/intel/threatIntel";
import { attachReport } from "@/lib/persist";
import { rateLimit, rateLimitRequest, tooManyRequests } from "@/lib/rate-limit";
import {
  getSessionId,
  jsonError,
  NO_STORE_HEADERS,
  urlSchema,
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

  const parsed = urlSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  try {
    const result = await analyzeUrl(parsed.data.url);
    const [enriched, threatIntel] = await Promise.all([
      enrichResult(result, {
        inputType: "url",
        text: result.url?.normalized ?? parsed.data.url,
      }),
      result.url
        ? collectUrlThreatIntel(result.url, result.domainIntel)
        : Promise.resolve(undefined),
    ]);
    const saved = await attachReport(
      { ...enriched, threatIntel },
      sessionId,
      parsed.data.url
    );
    return NextResponse.json(saved, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return jsonError(
        "That does not look like a valid URL. Try something like https://example.com/page.",
        422
      );
    }
    console.error("URL analysis failed:", error);
    return jsonError("URL analysis failed. Please try again.", 500);
  }
}
