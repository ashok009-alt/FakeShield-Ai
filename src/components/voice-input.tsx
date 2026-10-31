"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpeechResultAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechResultAlternative;
}
interface SpeechEvent extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
}
interface SpeechErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

const LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
];

/**
 * Web Speech API dictation. Runs entirely in the browser: audio is handled by
 * the browser's speech service, never by FakeShield's server. The transcript is
 * appended to the textarea for the user to review before analysing.
 */
export function VoiceInput({ onAppend }: { onAppend: (text: string) => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState("en-IN");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const appendRef = useRef(onAppend);
  appendRef.current = onAppend;

  useEffect(() => {
    const scope = window as SpeechWindow;
    setSupported(Boolean(scope.SpeechRecognition || scope.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function start() {
    const scope = window as SpeechWindow;
    const Ctor = scope.SpeechRecognition || scope.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input is not available in this browser", {
        description: "Chrome, Edge or Safari 16+ support the Web Speech API.",
      });
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setInterim("");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        appendRef.current(finalText.trim());
        setInterim("");
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "aborted") return;
      const message =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied. Allow it in the browser's site settings."
          : event.error === "no-speech"
            ? "No speech was detected. Try again and speak clearly."
            : "Voice input stopped unexpectedly.";
      toast.error(message);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
      toast.error("Could not start voice input. Try again.");
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
  }

  if (supported === false) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10.5px] text-stone-500">
        <MicOff className="size-3" />
        Voice input needs Chrome, Edge or Safari
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <label className="sr-only" htmlFor="voice-language">
        Dictation language
      </label>
      <select
        id="voice-language"
        value={lang}
        onChange={(event) => setLang(event.target.value)}
        disabled={listening}
        className="h-7 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 text-[10.5px] text-stone-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:opacity-60"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code} className="bg-[#150e08]">
            {language.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant={listening ? "default" : "outline"}
        onClick={listening ? stop : start}
        aria-pressed={listening}
        className={cn(
          "h-7 gap-1.5 rounded-full px-2.5 text-[10.5px]",
          listening && "bg-red-500/90 text-white hover:bg-red-500"
        )}
      >
        {listening ? (
          <>
            <Square className="size-3 fill-current" />
            Stop listening
          </>
        ) : (
          <>
            <Mic className="size-3" />
            Speak instead
          </>
        )}
      </Button>
      <span aria-live="polite" className="text-[10.5px] text-stone-500">
        {listening ? interim || "Listening…" : ""}
      </span>
    </div>
  );
}
