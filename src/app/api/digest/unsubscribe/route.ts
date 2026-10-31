import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

function page(title: string, message: string) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title} · FakeShield AI</title></head>
    <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0c0906;color:#eadfd2;font-family:Segoe UI,Helvetica,Arial,sans-serif;padding:24px;">
      <main style="max-width:440px;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:28px;background:rgba(255,255,255,.02);">
        <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#fdba74;">FakeShield AI</p>
        <h1 style="margin:8px 0 10px;font-size:20px;color:#fff7ed;">${title}</h1>
        <p style="margin:0;font-size:13px;line-height:21px;color:#b8a694;">${message}</p>
        <p style="margin:18px 0 0;"><a href="/trends" style="color:#fdba74;font-size:13px;">Back to trends</a></p>
      </main>
    </body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    }
  );
}

export async function GET(request: Request) {
  const limit = await rateLimitRequest(request, "digest", 10, 60_000);
  if (!limit.ok) {
    return page("Please wait a moment", "Too many unsubscribe requests from this connection.");
  }

  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email || !z.string().email().safeParse(email).success) {
    return page("Invalid link", "This unsubscribe link is missing a valid email address.");
  }

  try {
    await prisma.digestSubscriber.deleteMany({ where: { email } });
    return page(
      "You are unsubscribed",
      "That address will not receive the weekly threat report. You can subscribe again from the trends page."
    );
  } catch (error) {
    console.error("Digest unsubscribe failed:", error);
    return page("Could not unsubscribe", "Please try again in a moment.");
  }
}
