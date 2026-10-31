import { NextResponse, after } from "next/server";
import {
  analyzeChannelText,
  CHANNEL_MAX_INPUT,
  channelConfig,
  channelGreeting,
  formatChannelReply,
  isGreeting,
} from "@/lib/channels/core";
import { verifyWhatsAppSignature } from "@/lib/channels/verify";
import { cacheGet, cacheSet } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface WhatsAppMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
}

interface WhatsAppPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsAppMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
}

async function sendMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text, preview_url: false },
        }),
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      }
    );
    if (!response.ok) {
      console.error("WhatsApp send failed:", response.status);
    }
  } catch (error) {
    console.error("WhatsApp send error:", error);
  }
}

async function handleMessage(message: WhatsAppMessage) {
  const from = message.from;
  if (!from) return;

  const limit = rateLimit(`channel:whatsapp:${from}`, 10, 60_000);
  if (!limit.ok) {
    await sendMessage(from, "Too many messages. Please wait a minute and try again.");
    return;
  }

  if (message.type !== "text") {
    await sendMessage(
      from,
      "I can only read typed text in WhatsApp. Send the suspicious message as text. Screenshot analysis is available on the FakeShield website."
    );
    return;
  }

  const text = (message.text?.body ?? "").trim();
  if (!text || isGreeting(text)) {
    await sendMessage(from, channelGreeting("whatsapp"));
    return;
  }
  if (text.length < 10) {
    await sendMessage(from, "Please send the whole suspicious message so I have enough to analyse.");
    return;
  }

  try {
    const result = await analyzeChannelText(text.slice(0, CHANNEL_MAX_INPUT));
    await sendMessage(from, formatChannelReply(result, "whatsapp"));
  } catch (error) {
    console.error("WhatsApp analysis failed:", error);
    await sendMessage(
      from,
      "Sorry, the analysis failed. Try again in a moment. FakeShield AI provides risk guidance, not a final security verdict."
    );
  }
}

/** Meta webhook verification handshake. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  if (!channelConfig().whatsapp) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "WhatsApp channel is not configured. Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN and WHATSAPP_APP_SECRET.",
      },
      { status: 503 }
    );
  }

  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWhatsAppSignature(raw, signature, process.env.WHATSAPP_APP_SECRET ?? "")) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let payload: WhatsAppPayload;
  try {
    payload = JSON.parse(raw) as WhatsAppPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const messages =
    payload.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? []
    ) ?? [];

  // Meta retries webhooks; remember recent message ids for 15 minutes.
  const fresh: WhatsAppMessage[] = [];
  for (const message of messages) {
    if (!message.id) {
      fresh.push(message);
      continue;
    }
    const seen = await cacheGet<boolean>(`channels:wa:${message.id}`);
    if (seen) continue;
    await cacheSet(`channels:wa:${message.id}`, true, 900);
    fresh.push(message);
  }

  for (const message of fresh) {
    after(async () => {
      await handleMessage(message);
    });
  }

  // Meta only requires a prompt 200; analysis continues in `after`.
  return NextResponse.json({ received: true });
}
