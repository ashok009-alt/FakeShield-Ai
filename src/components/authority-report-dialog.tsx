"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, FileWarning, Phone, Scale, ShieldAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildComplaintDraft, complaintFilename, CYBERCRIME_URL, HELPLINE } from "@/lib/authority";
import { copyText, downloadText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AuthorityReportDialog({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !draft) setDraft(buildComplaintDraft(result));
  }

  async function copyDraft() {
    const ok = await copyText(draft);
    if (ok) toast.success("Complaint draft copied");
    else toast.error("Could not copy. Select the text manually.");
  }

  function downloadDraft() {
    downloadText(complaintFilename(result), draft);
    toast.success("Draft downloaded", { description: "Attach it to your cybercrime.gov.in complaint." });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Scale className="size-3.5" />
          Complaint draft
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="size-4 text-orange-300" />
            Cyber-fraud complaint draft
          </DialogTitle>
          <DialogDescription>
            Pre-filled with the warning signs and indicators from this analysis. Review it, add your
            own account of what happened, then file it on the official portal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-3">
          <Step
            icon={<Phone className="size-3.5 text-red-300" />}
            title="Money moved?"
            detail={`Call ${HELPLINE} immediately and ask your bank to flag the transaction.`}
          />
          <Step
            icon={<ExternalLink className="size-3.5 text-orange-300" />}
            title="File online"
            detail="Use cybercrime.gov.in → Report Cyber Crime. Keep the acknowledgement number."
          />
          <Step
            icon={<ShieldAlert className="size-3.5 text-amber-300" />}
            title="Keep evidence"
            detail="Screenshots, transaction IDs and the original message. Do not delete the chat."
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="complaint-draft" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Editable draft
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => void copyDraft()}>
                <Copy className="size-3.5" />
                Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadDraft}>
                <Download className="size-3.5" />
                Download .txt
              </Button>
            </div>
          </div>
          <Textarea
            id="complaint-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={16}
            spellCheck
            className="mt-2 min-h-[320px] font-mono text-[11.5px] leading-5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={CYBERCRIME_URL} target="_blank" rel="noreferrer noopener">
              Open cybercrime.gov.in
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={`tel:${HELPLINE}`}>
              <Phone className="size-3.5" />
              Call {HELPLINE}
            </a>
          </Button>
          <span className="text-[10px] leading-5 text-stone-500">
            FakeShield cannot file or track a complaint for you.
          </span>
        </div>

        <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[10.5px] leading-5 text-amber-200/80">
          The draft deliberately leaves your name, phone and address blank. Enter those only on the
          official government portal — never send them to a “recovery agent” who contacts you after
          the scam.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-200">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-stone-500">{detail}</p>
    </div>
  );
}
