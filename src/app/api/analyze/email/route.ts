import { NextResponse } from "next/server";
import { analyzeEmail } from "@/lib/analysis/emailAnalyzer";
import { enrichResult } from "@/lib/intel/enrich";
import { lookupBreaches } from "@/lib/intel/threatIntel";
import { attachReport } from "@/lib/persist";
import { rateLimit, rateLimitRequest, tooManyRequests } from "@/lib/rate-limit";
import {
  emailSchema,
  getSessionId,
  jsonError,
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

  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const data = parsed.data;

  try {
    const result = analyzeEmail({
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo,
      subject: data.subject,
      body: data.body,
    });

    const rawInput = [
      `From: ${data.fromName ? `${data.fromName} <${data.fromEmail}>` : data.fromEmail}`,
      data.replyTo ? `Reply-To: ${data.replyTo}` : null,
      `Subject: ${data.subject || "(no subject)"}`,
      "",
      data.body,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const [enriched, breach] = await Promise.all([
      enrichResult(result, {
        inputType: "email",
        text: [data.subject, data.body].filter(Boolean).join("\n\n"),
        senderEmail: data.fromEmail,
        headers: {
          from: data.fromName ? `${data.fromName} <${data.fromEmail}>` : data.fromEmail,
          replyTo: data.replyTo,
          subject: data.subject,
        },
      }),
      data.checkBreach ? lookupBreaches(data.fromEmail) : Promise.resolve(undefined),
    ]);

    const saved = await attachReport({ ...enriched, breach }, sessionId, rawInput);
    return NextResponse.json(saved, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Email analysis failed:", error);
    return jsonError("Email analysis failed. Please try again.", 500);
  }
}
