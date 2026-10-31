import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { digestConfigured } from "@/lib/digest";
import { rateLimitRequest, tooManyRequests } from "@/lib/rate-limit";
import { jsonError, NO_STORE_HEADERS, zodError } from "@/lib/validation";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  email: z
    .string({ required_error: "Enter your email address." })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(200, "That email address is too long."),
  consent: z.boolean().refine((value) => value === true, {
    message: "Confirm that you want the weekly email.",
  }),
});

export async function POST(request: Request) {
  const limit = await rateLimitRequest(request, "digest", 5, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  try {
    await prisma.digestSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email, source: "trends" },
      update: {},
    });
  } catch (error) {
    console.error("Digest subscribe failed:", error);
    return jsonError("Could not save that address. Please try again.", 500);
  }

  const configured = digestConfigured();
  return NextResponse.json(
    {
      ok: true,
      subscribed: true,
      deliveryConfigured: configured,
      message: configured
        ? "You are on the list. The next weekly report will arrive by email."
        : "Address saved locally. Email delivery is not enabled in this demo until SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are configured.",
    },
    { headers: NO_STORE_HEADERS }
  );
}

export async function DELETE(request: Request) {
  const limit = await rateLimitRequest(request, "digest", 5, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email || !z.string().email().safeParse(email).success) {
    return jsonError("Enter a valid email address to remove.", 400);
  }

  try {
    await prisma.digestSubscriber.deleteMany({ where: { email } });
  } catch (error) {
    console.error("Digest unsubscribe failed:", error);
    return jsonError("Could not remove that address. Please try again.", 500);
  }
  return NextResponse.json({ ok: true, removed: true }, { headers: NO_STORE_HEADERS });
}
