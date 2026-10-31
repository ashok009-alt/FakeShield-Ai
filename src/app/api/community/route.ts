import { NextResponse } from "next/server";
import type { CommunityItem } from "@/lib/community";
import { prisma } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getSessionId, NO_STORE_HEADERS } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function topSignalLabel(raw: string): string {
  try {
    const signals = JSON.parse(raw) as { label?: string }[];
    return signals.find((signal) => typeof signal.label === "string")?.label ?? "Structural risk check";
  } catch {
    return "Structural risk check";
  }
}

export async function GET(request: Request) {
  const sessionId = getSessionId(request) ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`community:${sessionId}`, 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  try {
    const rows = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        inputType: true,
        riskLevel: true,
        riskScore: true,
        signals: true,
        createdAt: true,
      },
    });

    const items: CommunityItem[] = rows
      .filter(
        (row) =>
          row.inputType === "message" || row.inputType === "email" || row.inputType === "url"
      )
      .map((row) => ({
        inputType: row.inputType as CommunityItem["inputType"],
        riskLevel: row.riskLevel as CommunityItem["riskLevel"],
        riskScore: row.riskScore,
        topSignal: topSignalLabel(row.signals),
        createdAt: row.createdAt.toISOString(),
      }));

    return NextResponse.json(
      {
        items,
        updatedAt: new Date().toISOString(),
        note: "Derived fields only. Message text, links, phone numbers and personal details are never exposed.",
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Community feed failed:", error);
    return NextResponse.json(
      { error: "The community feed could not be loaded.", items: [] },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
