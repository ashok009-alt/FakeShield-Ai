import type { Metadata } from "next";
import { ImageUp } from "lucide-react";
import { ImageAnalyzerClient } from "@/components/image-analyzer-client";
import { ToolPageHeader } from "@/components/tool-page-header";

export const metadata: Metadata = {
  title: "Screenshot analyser",
  description:
    "Upload a WhatsApp, SMS or email screenshot. OCR runs in your browser, then FakeShield analyses the extracted text. The image never leaves your device.",
};

export default function ImagePage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Screenshot analyser"
        title="A screenshot is how most scams reach the family group."
        description="Drop in the screenshot you were sent. OCR reads it on your device, you correct any mistakes, and only the text is analysed. The image itself is never uploaded or stored."
        icon={ImageUp}
        badge={
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
            Image stays on device
          </span>
        }
      />

      <div className="mt-8">
        <ImageAnalyzerClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        OCR is English-language and runs locally with an open-source engine. Hindi or mixed-script
        screenshots may be misread — use the regional-language analyser for Hindi, Bengali, Tamil
        and Telugu text. OCR accuracy is never treated as evidence about the sender.
      </p>
    </div>
  );
}
