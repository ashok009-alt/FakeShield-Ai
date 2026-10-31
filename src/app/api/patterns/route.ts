import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = url.searchParams.get("category") ?? "";
  const level = url.searchParams.get("risk") ?? "";

  try {
    const rows = await prisma.scamPattern.findMany({ orderBy: { sortOrder: "asc" } });

    const patterns = rows
      .map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        riskLevel: row.riskLevel,
        summary: row.summary,
        warningSigns: parseArray(row.warningSigns),
        exampleMessage: row.exampleMessage,
        goal: row.goal,
        protection: parseArray(row.protection),
        relatedSignals: parseArray(row.relatedSignals),
        icon: row.icon,
      }))
      .filter((pattern) => {
        if (category && pattern.category !== category) return false;
        if (level && pattern.riskLevel !== level) return false;
        if (!query) return true;
        const haystack = [
          pattern.name,
          pattern.summary,
          pattern.category,
          pattern.goal,
          ...pattern.warningSigns,
          ...pattern.protection,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });

    return NextResponse.json(
      {
        patterns,
        total: patterns.length,
        categories: [...new Set(rows.map((row) => row.category))],
      },
      {
        headers: {
          // Static seed data shared by every visitor: cache at the edge.
          "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Patterns fetch failed:", error);
    return jsonError("Could not load the scam pattern library.", 500);
  }
}
