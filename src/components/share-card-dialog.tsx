"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildShareSummary } from "@/lib/report";
import { renderShareCard } from "@/lib/share-card";
import { copyText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShareCardDialog({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("working");
    renderShareCard(result)
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        setUrl(URL.createObjectURL(blob));
        setStatus("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        console.error("Share card failed:", caught);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, result]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  function download() {
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fakeshield-card-${result.riskLevel.toLowerCase()}-${result.riskScore}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast.success("Share card downloaded");
  }

  async function shareImage() {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], "fakeshield-card.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "FakeShield AI threat card",
          text: `${result.riskLevel} risk · ${result.riskScore}/100`,
          files: [file],
        });
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }
    download();
  }

  async function copySummary() {
    const ok = await copyText(buildShareSummary(result));
    if (ok) toast.success("Summary copied");
    else toast.error("Could not copy the summary.");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStatus("idle");
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      blobRef.current = null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <ImageIcon className="size-3.5" />
          Share card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Threat card</DialogTitle>
          <DialogDescription>
            A 1080×1350 PNG rendered on your device — score, risk level and the top warning signs.
            Nothing is uploaded to create it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[300px_1fr] sm:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-black/30">
            {url && status === "ready" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="FakeShield threat card preview" className="block w-full" />
            ) : status === "error" ? (
              <div className="grid aspect-[4/5] place-items-center px-5 text-center">
                <p className="text-[11px] leading-5 text-red-300">
                  The card could not be rendered in this browser. Try the JSON download or copy the
                  summary instead.
                </p>
              </div>
            ) : (
              <div className="grid aspect-[4/5] place-items-center">
                <span className="flex flex-col items-center gap-2 text-[11px] text-stone-500">
                  <Loader2 className="size-5 animate-spin text-orange-300" />
                  Rendering card…
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white/[0.02] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Included on the card
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-stone-400">
                <li>Risk score and level, large enough to read on a phone</li>
                <li>The analysis summary, capped at three lines</li>
                <li>Top three warning signs with severity</li>
                <li>“Risk guidance, not a final security verdict”</li>
              </ul>
            </div>

            <div className="grid gap-2">
              <Button onClick={download} disabled={!url}>
                <Download className="size-3.5" />
                Download PNG
              </Button>
              <Button variant="secondary" onClick={() => void shareImage()} disabled={!url}>
                <Share2 className="size-3.5" />
                Share image
              </Button>
              <Button variant="ghost" onClick={() => void copySummary()}>
                <Copy className="size-3.5" />
                Copy text summary
              </Button>
            </div>

            <p className="text-[10px] leading-5 text-stone-500">
              Before you post it: a card can contain a link or phone number from the message. Crop or
              cover anything personal.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
