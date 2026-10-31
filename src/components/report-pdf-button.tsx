"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResult } from "@/lib/analysis/types";
import { Button } from "@/components/ui/button";

/**
 * jsPDF is imported only when the button is pressed, so the main bundle stays
 * small. The report is built from the result object already on screen.
 */
export function ReportPdfButton({ result }: { result: AnalysisResult }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      const { downloadPdfReport } = await import("@/lib/pdf-report");
      await downloadPdfReport(result);
      toast.success("PDF report downloaded", {
        description: "Share it with a bank, employer or cybercrime complaint.",
      });
    } catch {
      toast.error("Could not build the PDF", {
        description: "Try again, or use Download JSON for the raw report.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => void handleDownload()} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
      {busy ? "Building PDF…" : "Download PDF"}
    </Button>
  );
}
