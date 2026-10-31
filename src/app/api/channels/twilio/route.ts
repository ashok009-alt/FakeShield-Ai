import { NextResponse } from "next/server";
import {
  analyzeChannelText,
  CHANNEL_MAX_INPUT,
  channelConfig,
  channelGreeting,
  escapeXml,
  formatChannelReply,
  isGreeting,
} from "@/lib/channels/core";
import { verifyTwilioSignature, webhookUrl } from "@/lib/channels/verify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function twiml(message: string) {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
    message
  )}</Message></Response>`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!channelConfig().sms) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "SMS channel is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER.",
      },
      { status: 503 }
    );
  }

  let params: Record<string, string>;
  try {
    const form = await request.formData();
    params = {};
    for (const [key, value] of form.entries()) {
      params[key] = typeof value === "string" ? value : "";
    }
  } catch {
    return twiml("Could not read that message. Please try again.");
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = webhookUrl(
    request,
    process.env.TWILIO_WEBHOOK_URL,
    new URL(request.url).pathname
  );

  if (!verifyTwilioSignature(url, params, signature, authToken)) {
    return new NextResponse("Invalid Twilio signature.", { status: 403 });
  }

  const from = (params.From ?? "").slice(0, 40);
  const limit = rateLimit(`channel:twilio:${from || clientIp(request)}`, 10, 60_000);
  if (!limit.ok) {
    return twiml("Too many messages from this number. Please wait a minute and try again.");
  }

  if (params.MediaUrl0 && !params.Body) {
    return twiml(
      "I can only read typed text over SMS. Send the suspicious message as text, or paste it into fakeshield on the website for screenshot support."
    );
  }

  const body = (params.Body ?? "").replace(/\s+/g, " ").trim();
  if (!body) return twiml(channelGreeting("sms"));
  if (isGreeting(body)) return twiml(channelGreeting("sms"));
  if (body.length < 10) {
    return twiml("Please send the whole suspicious message so there is enough to analyse.");
  }

  try {
    const result = await analyzeChannelText(body.slice(0, CHANNEL_MAX_INPUT));
    return twiml(formatChannelReply(result, "sms"));
  } catch (error) {
    console.error("SMS analysis failed:", error);
    return twiml(
      "Sorry, the analysis failed. Try again in a moment. FakeShield AI provides risk guidance, not a final security verdict."
    );
  }
}
