"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, FileWarning, Loader2, Trash2 } from "lucide-react";
import { deleteAnalysis, fetchAnalysis } from "@/lib/api-client";
import type { StoredAnalysis } from "@/lib/serialize";
import { INPUT_TYPE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { ResultPanel } from "@/components/result-panel";
import { BeforeAfterPanel } from "@/components/before-after-panel";
import { EmailPreview } from "@/components/email-preview";
import { UrlDetailsPanel } from "@/components/url-details";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReportView({ id }: { id: string }) {
  const router = useRouter();
  const [report, setReport] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAnalysis(id)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Report not found.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAnalysis(id);
      toast.success("Analysis deleted");
      router.push("/history");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the analysis.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="page-shell py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-orange-300"
        >
          <ArrowLeft className="size-3.5" />
          Back to history
        </Link>
        {report ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-stone-500 hover:text-red-300"
          >
            <Trash2 className="size-3.5" />
            Delete report
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="surface flex items-center gap-3 rounded-2xl p-5">
            <Loader2 className="size-4 animate-spin text-orange-300" />
            <p className="text-sm text-stone-400">Loading saved report…</p>
          </div>
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      ) : error || !report ? (
        <div className="surface mt-8 rounded-2xl p-8 text-center">
          <FileWarning className="mx-auto size-8 text-amber-300" />
          <h1 className="mt-3 text-lg font-semibold text-foreground">Report not available</h1>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-stone-400">
            {error ?? "This report does not exist."} Reports are tied to the anonymous session that
            created them — clearing browser storage or opening a different browser will hide saved
            history.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/history">View history</Link>
            </Button>
            <Button asChild>
              <Link href="/analyze">Run a new analysis</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
              Saved {" "}
              {INPUT_TYPE_LABEL[report.inputType] ?? "analysis"} report
            </p>
            <span className="text-stone-600">·</span>
            <p className="text-[11px] text-stone-500">{formatDateTime(report.createdAt)}</p>
            <span className="text-stone-600">·</span>
            <p className="font-mono text-[10px] text-stone-600">{report.id}</p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Saved {" "}
            {INPUT_TYPE_LABEL[report.inputType]?.toLowerCase() ?? "analysis"} analysis
          </h1>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-6 text-stone-400">{report.summary}</p>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <ResultPanel
                result={report}
                showReportLink={false}
                inputLength={report.rawInput.length}
              />
              <BeforeAfterPanel text={report.rawInput} result={report} />
            </div>

            <div className="space-y-4 lg:sticky lg:top-32">
              <div className="surface rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground">Original input</h2>
                <p className="mt-1 text-[11px] text-stone-500">
                  Stored exactly as submitted. Treat it as untrusted text — nothing here is
                  clickable.
                </p>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-black/25 p-4 font-mono text-[11.5px] leading-6 text-stone-300">
                  {report.rawInput}
                </pre>
              </div>

              {report.email ? <EmailPreview email={report.email} /> : null}
              {report.url ? <UrlDetailsPanel result={report} /> : null}

              <div className="rounded-xl border border-border/60 px-4 py-3">
                <p className="flex items-start gap-2 text-[11px] leading-5 text-stone-500">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  FakeShield AI provides risk guidance, not a final security verdict. Delete this
                  report if it contains details you do not want stored on this machine.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this report?</DialogTitle>
            <DialogDescription>
              The analysis and its extracted details will be removed from the local database. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
