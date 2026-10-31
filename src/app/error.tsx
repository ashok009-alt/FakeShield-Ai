"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center py-20">
      <div className="surface w-full max-w-lg rounded-2xl p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Something interrupted that view
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-stone-400">
          The page hit an unexpected error. Your saved analyses were not touched. Try again, or head
          back to the analyzer.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} variant="secondary">
            <RotateCcw className="size-4" />
            Try again
          </Button>
          <Button asChild>
            <Link href="/analyze">
              Open analyzer
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
          <ShieldCheck className="size-3.5" />
          FakeShield AI provides risk guidance, not a final security verdict.
        </p>
      </div>
    </div>
  );
}
