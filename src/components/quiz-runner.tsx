"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { quizQuestions } from "@/lib/data/quiz";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Phase = "answering" | "results";

export function QuizRunner() {
  const total = quizQuestions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array.from({ length: total }, () => null)
  );
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<Phase>("answering");

  const question = quizQuestions[index];
  const selected = answers[index];
  const answeredCount = answers.filter((value) => value !== null).length;
  const score = useMemo(
    () =>
      quizQuestions.reduce(
        (count, item, position) => (answers[position] === item.answerIndex ? count + 1 : count),
        0
      ),
    [answers]
  );

  function choose(optionIndex: number) {
    if (revealed) return;
    setAnswers((current) => {
      const next = [...current];
      next[index] = optionIndex;
      return next;
    });
    setRevealed(true);
  }

  function goNext() {
    if (index === total - 1) {
      setPhase("results");
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(answers[index + 1] !== null);
  }

  function goBack() {
    if (index === 0) return;
    setIndex((current) => current - 1);
    setRevealed(answers[index - 1] !== null);
  }

  function restart() {
    setAnswers(Array.from({ length: total }, () => null));
    setIndex(0);
    setRevealed(false);
    setPhase("answering");
  }

  if (phase === "results") {
    const percent = Math.round((score / total) * 100);
    const verdict =
      percent >= 90
        ? {
            title: "Excellent instinct.",
            detail:
              "You spot the common tricks. Keep verifying through official channels anyway — good scams are designed to look ordinary.",
          }
        : percent >= 70
          ? {
              title: "Solid awareness.",
              detail:
                "You would catch most attempts. Review the questions you missed — those are the gaps scammers rely on.",
            }
          : percent >= 40
            ? {
                title: "A useful start.",
                detail:
                  "Some patterns are still catching you. Read the email and link guides, then try again — the scenarios repeat in real life.",
              }
            : {
                title: "Worth another pass.",
                detail:
                  "Scams are engineered to feel normal. Work through the learning center guides, then retake the quiz.",
              };

    return (
      <div className="space-y-6">
        <div className="surface rounded-2xl p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
            <Trophy className="size-7" />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Quiz complete
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {score} / {total} correct
          </h2>
          <p className="mt-1 text-sm text-orange-300">{percent}%</p>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-stone-400">{verdict.title}</p>
          <p className="mx-auto mt-1 max-w-lg text-[13px] leading-6 text-stone-400">{verdict.detail}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={restart} variant="secondary">
              <RotateCcw className="size-4" />
              Retake the quiz
            </Button>
            <Button asChild>
              <Link href="/learn">
                Review the guides
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">Answer review</h3>
          <ol className="mt-4 space-y-4">
            {quizQuestions.map((item, position) => {
              const picked = answers[position];
              const correct = picked === item.answerIndex;
              return (
                <li key={item.id} className="rounded-xl border border-border/70 bg-black/20 p-4">
                  <div className="flex items-start gap-2.5">
                    {correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                    )}
                    <div>
                      <p className="text-[13px] font-medium leading-5 text-foreground">
                        {position + 1}. {item.question}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-5 text-stone-400">
                        Correct answer:{" "}
                        <span className="text-emerald-300">{item.options[item.answerIndex]}</span>
                      </p>
                      {!correct ? (
                        <p className="mt-0.5 text-[12.5px] leading-5 text-stone-500">
                          You chose: {picked === null || picked === undefined ? "Not answered" : item.options[picked]}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-[12.5px] leading-5 text-stone-400">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="surface rounded-2xl p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300/80">
          Question {index + 1} of {total}
        </p>
        <p className="text-[11px] tabular-nums text-stone-500">
          {answeredCount} answered · score {score}
        </p>
      </div>
      <Progress value={((index + (revealed ? 1 : 0)) / total) * 100} className="mt-3 h-1.5" />

      <fieldset className="mt-6">
        <legend className="text-lg font-semibold leading-7 tracking-tight text-foreground">
          {question.question}
        </legend>
        <div className="mt-4 space-y-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.answerIndex;
            const isPicked = selected === optionIndex;
            const state = !revealed
              ? "idle"
              : isCorrect
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "muted";
            return (
              <button
                key={option}
                type="button"
                disabled={revealed}
                onClick={() => choose(optionIndex)}
                aria-pressed={isPicked}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13px] leading-5 transition-colors",
                  state === "idle" &&
                    "border-border bg-white/[0.02] text-stone-300 hover:border-orange-500/40 hover:bg-orange-500/[0.06]",
                  state === "correct" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
                  state === "wrong" && "border-red-500/40 bg-red-500/10 text-red-100",
                  state === "muted" && "border-border/70 bg-white/[0.01] text-stone-500"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold",
                    state === "idle" && "border-stone-600 text-stone-400",
                    state === "correct" && "border-emerald-400/60 text-emerald-200",
                    state === "wrong" && "border-red-400/60 text-red-200",
                    state === "muted" && "border-stone-700 text-stone-600"
                  )}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {revealed ? (
        <div
          className={cn(
            "mt-4 rounded-xl border p-4",
            selected === question.answerIndex
              ? "border-emerald-500/25 bg-emerald-500/[0.07]"
              : "border-amber-500/25 bg-amber-500/[0.07]"
          )}
        >
          <p className="text-[12px] font-semibold uppercase tracking-wider text-stone-300">
            {selected === question.answerIndex ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-stone-300">{question.explanation}</p>
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-stone-500">
          Choose an answer to see the explanation. You cannot change it afterwards in this attempt.
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <Button variant="ghost" onClick={goBack} disabled={index === 0}>
          <ArrowLeft className="size-4" />
          Previous
        </Button>
        <Button onClick={goNext} disabled={!revealed}>
          {index === total - 1 ? "See results" : "Next question"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
