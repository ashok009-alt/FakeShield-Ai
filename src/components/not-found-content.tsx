import Link from "next/link";
import { ArrowLeft, Compass, ScanText, ShieldQuestion } from "lucide-react";

export function NotFoundContent() {
  return (
    <div className="page-shell grid min-h-[70vh] place-items-center py-16">
      <title>Page not found · FakeShield AI</title>
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-300">
          <ShieldQuestion className="size-7" />
        </span>
        <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          The address may be mistyped, or the page may have moved. Nothing was analyzed — you are
          still on the FakeShield demo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white/[0.035] px-4 text-sm font-medium text-foreground transition-colors hover:border-stone-600"
          >
            <ArrowLeft className="size-4" />
            Go home
          </Link>
          <Link
            href="/analyze"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-300"
          >
            <ScanText className="size-4" />
            Analyze a message
          </Link>
          <Link
            href="/patterns"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.05]"
          >
            <Compass className="size-4" />
            Browse patterns
          </Link>
        </div>
      </div>
    </div>
  );
}
