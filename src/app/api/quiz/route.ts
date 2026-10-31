import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { quizQuestions } from "@/lib/data/quiz";
import { jsonError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.quizQuestion.findMany({ orderBy: { sortOrder: "asc" } });

    const questions =
      rows.length > 0
        ? rows.map((row) => {
            let options: string[] = [];
            try {
              const parsed = JSON.parse(row.options);
              if (Array.isArray(parsed)) options = parsed.map(String);
            } catch {
              options = [];
            }
            return {
              id: row.id,
              question: row.question,
              options,
              answerIndex: row.answerIndex,
              explanation: row.explanation,
            };
          })
        : quizQuestions.map(({ order: _order, ...question }) => question);

    return NextResponse.json(
      {
        questions,
        total: questions.length,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Quiz fetch failed, serving built-in questions:", error);
    return NextResponse.json(
      {
        questions: quizQuestions.map(({ order: _order, ...question }) => question),
        total: quizQuestions.length,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=3600",
        },
      }
    );
  }
}
