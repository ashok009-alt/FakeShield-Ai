"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  FileImage,
  ImageUp,
  Loader2,
  Lock,
  RotateCcw,
  ScanLine,
  ScanText,
  Sparkles,
  Upload,
} from "lucide-react";
import { analyzeMessage } from "@/lib/api-client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { recognizeScreenshot, type OcrProgress } from "@/lib/ocr";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ResultPanel } from "@/components/result-panel";
import { BeforeAfterPanel } from "@/components/before-after-panel";
import { AnalyzerEmptyState } from "@/components/analyzer-empty-state";
import { cn } from "@/lib/utils";

type Phase = "idle" | "reading" | "review" | "analyzing" | "done";

const MAX_BYTES = 12 * 1024 * 1024;

export function ImageAnalyzerClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const analysisAbort = useRef<AbortController | null>(null);
  const ocrAbort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      analysisAbort.current?.abort();
      ocrAbort.current?.abort();
    },
    []
  );

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  function reset(clearFile = true) {
    analysisAbort.current?.abort();
    analysisAbort.current = null;
    ocrAbort.current?.abort();
    ocrAbort.current = null;
    setPhase("idle");
    setProgress(null);
    setConfidence(null);
    setResult(null);
    setError(null);
    if (clearFile) {
      setFile(null);
      setPreview(null);
      setText("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function processFile(next: File) {
    if (!next.type.startsWith("image/")) {
      setError("Choose a PNG, JPG or WebP screenshot.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("That screenshot is larger than 12 MB. Trim or compress it first.");
      return;
    }

    analysisAbort.current?.abort();
    ocrAbort.current?.abort();
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setPhase("reading");
    setResult(null);
    setText("");
    setConfidence(null);
    setError(null);
    setProgress({ stage: "preparing", progress: 0.02, detail: "Preparing the screenshot" });

    const controller = new AbortController();
    ocrAbort.current = controller;
    try {
      const ocr = await recognizeScreenshot(next, setProgress, controller.signal);
      if (controller.signal.aborted) return;
      setText(ocr.text);
      setConfidence(ocr.confidence);
      setPhase("review");
      toast.success("Text extracted on this device", {
        description: `${ocr.text.split(/\s+/).length} words · ${ocr.confidence}% OCR confidence`,
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "The screenshot could not be read.";
      setError(message);
      setPhase("idle");
      toast.error(message);
    } finally {
      if (ocrAbort.current === controller) ocrAbort.current = null;
    }
  }

  async function analyze() {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setError("There is not enough text to analyse. Add a few more words or try a sharper image.");
      return;
    }
    analysisAbort.current?.abort();
    const controller = new AbortController();
    analysisAbort.current = controller;
    setPhase("analyzing");
    setError(null);
    setResult(null);
    try {
      const data = await analyzeMessage(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      setPhase("done");
      if (!data.id) {
        toast.warning("Analysed, but not saved", {
          description: "The history database could not be reached.",
        });
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Analysis failed.";
      setError(message);
      setPhase("review");
      toast.error(message);
    } finally {
      if (analysisAbort.current === controller) analysisAbort.current = null;
    }
  }

  async function useDemoScreenshot() {
    try {
      const blob = await createDemoScreenshot();
      const demo = new File([blob], "demo-whatsapp-scam.png", { type: "image/png" });
      void processFile(demo);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not create the demo screenshot.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-raised rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ImageUp className="size-4 text-orange-300" />
              Screenshot input
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              <Lock className="size-3" />
              On-device OCR
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) void processFile(next);
            }}
          />

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const next = event.dataTransfer.files?.[0];
              if (next) void processFile(next);
            }}
            className={cn(
              "relative mt-4 overflow-hidden rounded-xl border border-dashed transition-colors",
              dragging
                ? "border-orange-400/60 bg-orange-500/[0.06]"
                : "border-[#4a3422] bg-black/20"
            )}
          >
            {preview ? (
              <div className="relative">
                {/* The uploaded screenshot is shown locally for review only. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Uploaded screenshot preview"
                  className="max-h-[360px] w-full object-contain"
                />
                {phase === "reading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-[2px]">
                    <Loader2 className="size-7 animate-spin text-orange-300" />
                    <p className="text-xs font-medium text-white">Reading on this device…</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex min-h-[250px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center transition-colors hover:bg-white/[0.02]"
              >
                <span className="grid size-12 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/[0.08]">
                  <Upload className="size-5 text-orange-300" />
                </span>
                <span className="text-sm font-semibold text-white">
                  Drop a screenshot or choose a file
                </span>
                <span className="max-w-xs text-[12px] leading-5 text-stone-500">
                  WhatsApp, SMS or email screenshots. PNG, JPG or WebP up to 12 MB. The image is
                  processed in your browser and never uploaded.
                </span>
              </button>
            )}
          </div>

          {progress && phase === "reading" ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-stone-400">{progress.detail}</span>
                <span className="tabular-nums text-stone-500">
                  {Math.round(progress.progress * 100)}%
                </span>
              </div>
              <Progress value={progress.progress * 100} className="mt-2" label="OCR progress" />
              <p className="mt-2 text-[10.5px] leading-5 text-stone-500">
                The first run loads a 3 MB OCR model from this site. Recognition happens entirely
                in your browser.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 flex items-start gap-2 text-xs leading-5 text-red-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <Camera className="size-3.5" />
              {file ? "Choose another" : "Choose screenshot"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void useDemoScreenshot()}>
              <Sparkles className="size-3.5" />
              Try a generated sample
            </Button>
            {file ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => reset()}>
                <RotateCcw className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>

          <p className="mt-4 flex items-start gap-2 border-t border-border/60 pt-3 text-[10.5px] leading-5 text-stone-500">
            <Lock className="mt-0.5 size-3 shrink-0 text-emerald-400/70" />
            Only the extracted text is sent for analysis. The screenshot itself never leaves this
            device.
          </p>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileImage className="size-4 text-orange-300" />
              Extracted text
            </h2>
            {confidence !== null ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                OCR confidence {confidence}%
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11.5px] leading-5 text-stone-500">
            Review and correct the text before analysing. OCR can misread small or stylised fonts.
          </p>

          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            placeholder="The extracted message will appear here. You can also paste text directly."
            className="mt-3 min-h-[210px] text-[13px] leading-6"
            maxLength={10000}
            spellCheck={false}
            aria-label="Text extracted from the screenshot"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => void analyze()} disabled={phase === "analyzing" || phase === "reading"}>
              {phase === "analyzing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <ScanLine className="size-4" />
                  Analyse extracted text
                </>
              )}
            </Button>
            <span className="text-[10.5px] text-stone-500">
              {text.trim().length.toLocaleString("en-IN")} / 10,000 characters
            </span>
          </div>
          <p className="mt-3 text-[10.5px] leading-5 text-stone-600">
            FakeShield AI provides risk guidance, not a final security verdict.
          </p>
        </div>
      </div>

      {result ? (
        <>
          <ResultPanel
            result={result}
            inputLength={text.trim().length}
            onReset={() => {
              setResult(null);
              setPhase("review");
            }}
          />
          <BeforeAfterPanel text={text} result={result} />
        </>
      ) : phase !== "reading" ? (
        <AnalyzerEmptyState
          icon={ScanText}
          title="Screenshots carry the message, not the sender"
          description="OCR recovers the words so the rule engine can inspect urgency, credential requests, links and impersonation. It cannot verify who actually sent the screenshot."
          steps={[
            "Upload a WhatsApp, SMS or email screenshot.",
            "Check the extracted text for OCR mistakes.",
            "Read the score, the reasons and what to do next.",
          ]}
        />
      ) : null}
    </div>
  );
}

async function createDemoScreenshot(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 820;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the demo screenshot.");

  context.fillStyle = "#efeae2";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#075e54";
  context.fillRect(0, 0, canvas.width, 92);
  context.fillStyle = "#ffffff";
  context.font = "600 34px system-ui, sans-serif";
  context.fillText("SBI Alerts", 36, 58);
  context.font = "22px system-ui, sans-serif";
  context.fillStyle = "#d1fae5";
  context.fillText("online", 36, 84);

  const bubbleX = 44;
  const bubbleY = 136;
  const bubbleWidth = 900;
  const bubbleHeight = 560;
  context.fillStyle = "#ffffff";
  roundRect(context, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 26);
  context.fill();

  context.fillStyle = "#111b21";
  context.font = "31px system-ui, sans-serif";
  const lines = wrapText(
    context,
    "Dear Customer, your SBI account will be blocked today because KYC is pending. Update immediately at http://sbi-kyc-verify.xyz/login and share the OTP sent to your mobile to complete verification. Ignoring this may permanently close your account. - SBI Customer Care",
    bubbleWidth - 72
  );
  lines.slice(0, 13).forEach((line, index) => {
    context.fillText(line, bubbleX + 36, bubbleY + 70 + index * 42);
  });

  context.fillStyle = "#667781";
  context.font = "22px system-ui, sans-serif";
  context.textAlign = "right";
  context.fillText("10:42 AM", bubbleX + bubbleWidth - 36, bubbleY + bubbleHeight - 24);
  context.textAlign = "left";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not create the demo screenshot.");
  return blob;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
