import { createHmac, timingSafeEqual } from "node:crypto";

function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Twilio signs the exact webhook URL plus every POST parameter (sorted by key,
 * concatenated key+value). Configure TWILIO_WEBHOOK_URL when the app runs
 * behind a proxy so the signed URL matches exactly.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  if (!signature || !authToken) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((accumulator, key) => `${accumulator}${key}${params[key] ?? ""}`, url);
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  return sameString(expected, signature);
}

/** Meta signs the raw request body with the app secret (SHA-256). */
export function verifyWhatsAppSignature(
  rawBody: string,
  header: string | null,
  appSecret: string
): boolean {
  if (!header || !appSecret) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return sameString(expected, provided);
}

/** Telegram supports a secret token header on webhook updates. */
export function verifyTelegramSecret(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  return sameString(header, secret);
}

export function webhookUrl(request: Request, configured: string | undefined, path: string): string {
  const explicit = configured?.trim();
  if (explicit) return explicit;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}${path}`;
}
