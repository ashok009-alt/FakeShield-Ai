"use client";

/**
 * FAKESHIELD AI — CLIPBOARD THREAT MONITOR
 *
 * Automatically watches the clipboard every 2 seconds.
 * When the user copies a message or URL, it silently analyses it
 * in the background and shows a toast/popup if a threat is found.
 *
 * Works entirely in-browser — no server call until a threat is detected.
 * Quick heuristic pre-check runs client-side to avoid unnecessary API calls.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, ShieldCheck, X, ArrowRight,
  Clipboard, Loader2, AlertTriangle, Radio,
} from "lucide-react";
import Link from "next/link";

// ── Quick client-side pre-filter (no API call needed) ────────────
// Returns true if the text is worth sending to the full engine
const QUICK_SCAM_PATTERNS = [
  /otp|one.time.password/i,
  /account.*(block|suspend|frozen|deactivat)/i,
  /kyc|re.?verify|aadhaar|pan.card/i,
  /click.*(here|link|below)|tap.*link/i,
  /\b(upi|gpay|phonepe|paytm)\b.*\b(pay|request|collect)\b/i,
  /you.*(won|winner|prize|lottery|selected)/i,
  /urgent|immediately|within 24 hours|final warning/i,
  /credit card|debit card|cvv|pin|password/i,
  /anydesk|teamviewer|remote.access/i,
  /refund|cashback|reimburse/i,
  /bit\.ly|tinyurl|t\.co|goo\.gl/,
  /https?:\/\/[^\s]*[-]{3,}[^\s]*/,   // url with 3+ hyphens
  /https?:\/\/[^\s]*\.(xyz|tk|ml|ga|cf|gq|work|click|loan)\b/i,
  /₹\s?\d[\d,]+\s*(lakh|crore|thousand)?.*\bguaranteed?\b/i,
  /digital.arrest|cyber.cell|enforcement.directorate/i,
];

function isLikelyThreat(text: string): boolean {
  if (text.length < 10 || text.length > 15000) return false;
  return QUICK_SCAM_PATTERNS.some((p) => p.test(text));
}

function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim()) ||
         /^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}(\/\S*)?$/i.test(text.trim());
}

// ── Types ─────────────────────────────────────────────────────────
type AlertLevel = "checking" | "safe" | "threat" | "none";

interface ThreatAlert {
  level:        AlertLevel;
  score:        number;
  riskLevel:    string;
  summary:      string;
  reportId?:    string;
  text:         string;
  type:         "message" | "url";
}

// ── Main component ────────────────────────────────────────────────
export function ClipboardMonitor() {
  const [alert,        setAlert]       = useState<ThreatAlert | null>(null);
  const [permission,   setPermission]  = useState<"unknown" | "granted" | "denied">("unknown");
  const [monitoring,   setMonitoring]  = useState(false);
  const [dismissed,    setDismissed]   = useState(false);
  const lastText   = useRef("");
  const intervalRef= useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Request clipboard permission ─────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      const perm = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
      if (perm.state === "granted" || perm.state === "prompt") {
        // Try reading once to trigger the browser prompt
        await navigator.clipboard.readText();
        setPermission("granted");
        setMonitoring(true);
      } else {
        setPermission("denied");
      }
    } catch {
      // Some browsers don't support permission query — try directly
      try {
        await navigator.clipboard.readText();
        setPermission("granted");
        setMonitoring(true);
      } catch {
        setPermission("denied");
      }
    }
  }, []);

  // ── Analyse clipboard content ─────────────────────────────────
  const analyseClipboard = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastText.current) return;
    if (trimmed.length < 10) return;

    lastText.current = trimmed;

    // Pre-filter: skip obviously safe content (plain English sentences, code, etc.)
    if (!isLikelyThreat(trimmed) && !isUrl(trimmed)) return;

    const type = isUrl(trimmed) ? "url" : "message";

    setDismissed(false);
    setAlert({ level: "checking", score: 0, riskLevel: "Checking", summary: "Scanning clipboard content…", text: trimmed, type });

    try {
      const res  = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: trimmed, type }),
      });
      if (!res.ok) { setAlert(null); return; }
      const data = await res.json();

      // Only show alert if risk is Medium or above
      if (data.riskScore < 25) {
        setAlert({
          level:    "safe",
          score:    data.riskScore,
          riskLevel:"Low",
          summary:  "No major threats detected in clipboard.",
          text:     trimmed,
          type,
        });
        // Auto-dismiss safe alerts after 4s
        setTimeout(() => setAlert(null), 4000);
        return;
      }

      setAlert({
        level:    "threat",
        score:    data.riskScore,
        riskLevel:data.riskLevel,
        summary:  data.summary,
        reportId: data.id,
        text:     trimmed,
        type,
      });
    } catch {
      setAlert(null);
    }
  }, []);

  // ── Polling interval ──────────────────────────────────────────
  useEffect(() => {
    if (!monitoring) return;

    intervalRef.current = setInterval(async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) analyseClipboard(text);
      } catch {
        // User revoked permission or browser blocked
        setMonitoring(false);
        setPermission("denied");
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [monitoring, analyseClipboard]);

  // ── Render: permission request button ─────────────────────────
  if (permission === "unknown") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={requestPermission}
          className="flex items-center gap-2.5 rounded-sm px-4 py-3 text-[12px] font-bold tracking-wide text-sky-950 shadow-lg transition-all hover:brightness-110"
          style={{
            background:  "linear-gradient(135deg,#38bdf8,#0ea5e9)",
            boxShadow:   "0 4px 20px rgba(14,165,233,0.45)",
            letterSpacing:"0.05em",
          }}
        >
          <Radio className="size-4 animate-pulse" />
          ENABLE AUTO-DETECT
        </button>
      </motion.div>
    );
  }

  // ── Render: threat / safe alert ───────────────────────────────
  return (
    <AnimatePresence>
      {alert && !dismissed && (
        <motion.div
          key="clipboard-alert"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0,  scale: 1    }}
          exit={{    opacity: 0, x: 60, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
          className="fixed bottom-6 right-6 z-50 w-[340px]"
          style={{
            background:  "linear-gradient(160deg,#091c30 0%,#060f1f 100%)",
            border:      alert.level === "threat"
              ? "1px solid rgba(239,68,68,0.35)"
              : alert.level === "checking"
              ? "1px solid rgba(14,165,233,0.25)"
              : "1px solid rgba(34,197,94,0.25)",
            borderRadius:"8px",
            boxShadow:   "0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              {alert.level === "checking" && (
                <Loader2 className="size-4 animate-spin text-sky-400" />
              )}
              {alert.level === "threat" && (
                <ShieldAlert className="size-4 text-red-400" />
              )}
              {alert.level === "safe" && (
                <ShieldCheck className="size-4 text-emerald-400" />
              )}
              <span className="text-[11px] font-black tracking-widest uppercase"
                style={{ color: alert.level === "threat" ? "#f87171" : alert.level === "safe" ? "#4ade80" : "#38bdf8" }}>
                {alert.level === "checking" ? "Scanning Clipboard…"
                  : alert.level === "threat" ? "⚠ Threat Detected"
                  : "✓ Clipboard Safe"}
              </span>
            </div>
            <button
              onClick={() => { setDismissed(true); setAlert(null); }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {alert.level === "checking" ? (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-500"
                    animate={{ width: ["0%","100%","0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-[11.5px] text-slate-400">Checking for scam patterns…</p>
              </div>
            ) : (
              <>
                {/* Risk score bar */}
                {alert.level === "threat" && (
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk score</span>
                      <span className="text-[12px] font-black" style={{ color: alert.score >= 75 ? "#f87171" : "#fb923c" }}>
                        {alert.score}/100 — {alert.riskLevel}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: alert.score >= 75 ? "#ef4444" : "#f97316" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${alert.score}%` }}
                        transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <p className="text-[12.5px] leading-5 text-slate-300 mb-3">{alert.summary}</p>

                {/* Clipped text preview */}
                <div
                  className="rounded-sm px-3 py-2 mb-3"
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clipboard className="size-3 text-slate-500" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      Clipboard content ({alert.type})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {alert.text.slice(0, 80)}{alert.text.length > 80 ? "…" : ""}
                  </p>
                </div>

                {/* Actions */}
                {alert.level === "threat" && (
                  <div className="flex gap-2">
                    <Link
                      href={alert.reportId
                        ? `/report/${alert.reportId}`
                        : `/analyze?text=${encodeURIComponent(alert.text.slice(0,500))}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-sm py-2 text-[11px] font-bold uppercase tracking-wide text-sky-950 transition-all hover:brightness-110"
                      style={{ background:"linear-gradient(135deg,#38bdf8,#0ea5e9)" }}
                    >
                      Full Report <ArrowRight className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => { setDismissed(true); setAlert(null); }}
                      className="px-3 rounded-sm text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
                      style={{ border:"1px solid rgba(255,255,255,0.08)" }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Monitoring indicator */}
          <div
            className="px-4 py-2 border-t flex items-center gap-1.5"
            style={{ borderColor:"rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.15)" }}
          >
            <span className="live-dot" style={{ width:5, height:5 }} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
              FakeShield auto-monitoring active
            </span>
          </div>
        </motion.div>
      )}

      {/* Monitoring pill when no alert */}
      {monitoring && !alert && (
        <motion.div
          key="monitoring-pill"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div
            className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest"
            style={{
              background:  "rgba(7,18,33,0.9)",
              border:      "1px solid rgba(14,165,233,0.15)",
              color:       "#4a6785",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="live-dot" style={{ width:5, height:5 }} />
            Auto-detect on
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
