import type { Metadata } from "next";
import { Languages } from "lucide-react";
import { LanguageAnalyzerClient } from "@/components/language-client";
import { ToolPageHeader } from "@/components/tool-page-header";

export const metadata: Metadata = {
  title: "Hindi & regional language checker",
  description:
    "Paste a scam message in Hindi, Bengali, Tamil, Telugu or Hinglish. FakeShield detects the script, glosses known scam phrases and runs the same risk engine.",
};

export default function LanguagePage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Regional languages"
        title="Scams arrive in the language you trust."
        description="Fake bank notices, electricity threats and digital-arrest calls are written in Hindi, Bengali, Tamil, Telugu and Hinglish. FakeShield detects the script, translates known scam phrases into an English gloss, and shows you exactly what the engine read."
        icon={Languages}
      />

      <div className="mt-8">
        <LanguageAnalyzerClient />
      </div>

      <p className="mt-6 max-w-3xl text-[11px] leading-5 text-stone-500">
        Translation is phrase-level, not a full machine-translation model. Four languages have
        dictionaries today; other scripts are detected and flagged as unrecognised. FakeShield AI
        provides risk guidance, not a final security verdict.
      </p>
    </div>
  );
}
