import { NextResponse, after } from "next/server";
import {
  analyzeChannelText,
  CHANNEL_MAX_INPUT,
  channelConfig,
  channelGreeting,
  formatChannelReply,
  isGreeting,
} from "@/lib/channels/core";
import { verifyTelegramSecret } from "@/lib/channels/verify";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface TelegramUpdate {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    photo?: unknown[];
    document?: { file_name?: string };
    caption?: string;
  };
  edited_message?: TelegramUpdate["message"];
}

async function sendMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Telegram sendMessage failed:", response.status);
    }
  } catch (error) {
    console.error("Telegram sendMessage error:", error);
  }
}

async function handleUpdate(message: NonNullable<TelegramUpdate["message"]>) {
  const chatId = message.chat?.id;
  if (chatId === undefined) return;

  const limit = rateLimit(`channel:telegram:${chatId}`, 10, 60_000);
  if (!limit.ok) {
    await sendMessage(chatId, "Too many messages. Please wait a minute and try again.");
    return;
  }

  if (message.photo || message.document) {
    await sendMessage(
      chatId,
      "I can only read typed text in Telegram. Forward the message as text. Screenshot analysis is available on the FakeShield website."
    );
    return;
  }

  const text = (message.text ?? message.caption ?? "").trim();
  if (!text || isGreeting(text)) {
    await sendMessage(chatId, channelGreeting("telegram"));
    return;
  }
  if (text.length < 10) {
    await sendMessage(chatId, "Please send the whole suspicious message so I have enough to analyse.");
    return;
  }

  try {
    const result = await analyzeChannelText(text.slice(0, CHANNEL_MAX_INPUT));
    await sendMessage(chatId, formatChannelReply(result, "telegram"));
  } catch (error) {
    console.error("Telegram analysis failed:", error);
    await sendMessage(
      chatId,
      "Sorry, the analysis failed. Try again in a moment. FakeShield AI provides risk guidance, not a final security verdict."
    );
  }
}

export async function POST(request: Request) {
  if (!channelConfig().telegram) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "Telegram channel is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET.",
      },
      { status: 503 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const provided = request.headers.get("x-telegram-bot-api-secret-token");
  if (!verifyTelegramSecret(provided, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook secret." }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const message = update.message ?? update.edited_message;
  // Acknowledge immediately; Telegram retries slow webhooks and the Gemini pass
  // can take several seconds. `after` keeps the work alive on the server.
  if (message) {
    after(async () => {
      await handleUpdate(message);
    });
  }
  return NextResponse.json({ ok: true });
}
