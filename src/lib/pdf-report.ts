import type { AnalysisResult } from "@/lib/analysis/types";
import { reportFilename } from "@/lib/report";

/**
 * One-click PDF report using jsPDF (loaded lazily on click).
 * The report is generated in English with the built-in Helvetica font, so it
 * carries the score, signals, actions and registry/threat-feed context — not the
 * raw message body. Links remain inert text; nothing is fetched.
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 46;
const CONTENT_W = PAGE_W - MARGIN * 2;

const RISK_RGB: Record<string, [number, number, number]> = {
  Low: [16, 150, 105],
  Medium: [200, 138, 15],
  High: [225, 105, 20],
  Critical: [210, 45, 45],
};

function clean(value: string): string {
  return value
    .replace(/₹/g, "Rs. ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function downloadPdfReport(result: AnalysisResult): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  let y = 0;
  let page = 1;

  const setText = (size: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [40, 36, 32]) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const footer = () => {
    setText(7.5, "normal", [130, 120, 110]);
    doc.text(
      "FakeShield AI provides risk guidance, not a final security verdict. Report cyber fraud at cybercrime.gov.in or 1930 (India).",
      MARGIN,
      PAGE_H - 28,
      { maxWidth: CONTENT_W }
    );
    doc.text(`Page ${page}`, PAGE_W - MARGIN, PAGE_H - 28, { align: "right" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = MARGIN;
  };

  const ensure = (height: number) => {
    if (y + height > PAGE_H - 52) newPage();
  };

  const heading = (label: string) => {
    ensure(30);
    y += 10;
    setText(8, "bold", [190, 95, 25]);
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(228, 220, 210);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 14;
  };

  const paragraph = (text: string, size = 9.5, color: [number, number, number] = [55, 50, 45]) => {
    const lines = doc.splitTextToSize(clean(text), CONTENT_W) as string[];
    for (const line of lines) {
      ensure(14);
      setText(size, "normal", color);
      doc.text(line, MARGIN, y);
      y += size + 4;
    }
  };

  /* Header band */
  doc.setFillColor(24, 16, 10);
  doc.rect(0, 0, PAGE_W, 96, "F");
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 92, PAGE_W, 4, "F");

  setText(16, "bold", [250, 245, 238]);
  doc.text("FakeShield AI", MARGIN, 40);

  setText(8, "normal", [200, 180, 160]);
  const generated = new Date(result.createdAt ?? Date.now()).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  });
  doc.text(`THREAT REPORT  ·  ${result.inputType.toUpperCase()}  ·  ${clean(generated)}`, MARGIN, 58);

  setText(7.5, "normal", [160, 145, 130]);
  doc.text(
    result.id ? `Report ID ${result.id}` : "Unsaved analysis session",
    MARGIN,
    74
  );

  y = 128;

  /* Verdict block */
  const risk = RISK_RGB[result.riskLevel] ?? RISK_RGB.Low;
  doc.setFillColor(248, 245, 241);
  doc.setDrawColor(232, 224, 214);
  doc.roundedRect(MARGIN, y, CONTENT_W, 86, 8, 8, "FD");

  setText(34, "bold", risk);
  doc.text(`${result.riskScore}`, MARGIN + 20, y + 52);
  setText(10, "normal", [120, 110, 100]);
  doc.text("/ 100", MARGIN + 20 + doc.getTextWidth(`${result.riskScore}`) + 4, y + 52);

  setText(12, "bold", risk);
  doc.text(clean(`${result.riskLevel.toUpperCase()} RISK`), MARGIN + 128, y + 34);
  setText(9, "normal", [90, 84, 78]);
  doc.text(
    `${Math.round(result.confidence * 100)}% confidence · ${result.signals.length} signal${
      result.signals.length === 1 ? "" : "s"
    }${result.llm && (result.llm.status === "ok" || result.llm.status === "cached") ? " · Gemini hybrid" : " · rule engine"}`,
    MARGIN + 128,
    y + 50
  );
  setText(7.5, "normal", [130, 120, 110]);
  doc.text(
    result.llm && (result.llm.status === "ok" || result.llm.status === "cached")
      ? `Semantic score ${result.llm.semanticScore}/100 blended with rule score ${result.llm.ruleScore ?? "—"}/100`
      : "Deterministic rule engine only",
    MARGIN + 128,
    y + 65
  );

  y += 108;

  /* Summary */
  paragraph(result.summary, 11, [35, 30, 26]);
  y += 4;

  if (result.otp?.requested) {
    ensure(28);
    doc.setFillColor(253, 236, 236);
    doc.setDrawColor(235, 160, 160);
    doc.roundedRect(MARGIN, y, CONTENT_W, 26, 5, 5, "FD");
    setText(8.5, "bold", [170, 30, 30]);
    doc.text("NEVER SHARE THE ONE-TIME CODE", MARGIN + 10, y + 16.5);
    y += 34;
  }

  if (result.officialDomain?.mismatch) {
    paragraph(
      `Official-domain mismatch: this input claims ${result.officialDomain.brand} but points to ${result.officialDomain.observedDomain}. Official domains: ${result.officialDomain.officialDomains.join(", ")}.`,
      9,
      [170, 30, 30]
    );
    y += 2;
  }

  /* AI review */
  if (result.llm && (result.llm.status === "ok" || result.llm.status === "cached") && result.llm.reasoning.length > 0) {
    heading("Gemini semantic review");
    if (result.llm.summary) paragraph(result.llm.summary, 9.5, [60, 52, 46]);
    for (const point of result.llm.reasoning) {
      const lines = doc.splitTextToSize(clean(`${point.title}: ${point.detail}`), CONTENT_W - 12) as string[];
      for (let index = 0; index < lines.length; index += 1) {
        ensure(13);
        setText(9, index === 0 ? "bold" : "normal", index === 0 ? [55, 48, 42] : [100, 92, 85]);
        doc.text(lines[index], MARGIN + 12, y);
        y += 12;
      }
      y += 3;
    }
    if (result.llm.tactics.length > 0) {
      paragraph(`Tactics: ${result.llm.tactics.join(", ")}.`, 8.5, [110, 92, 130]);
    }
  }

  /* Signals */
  heading(`Warning signs (${result.signals.length})`);
  if (result.signals.length === 0) {
    paragraph("No signal fired. This is not a guarantee that the input is genuine.", 9);
  } else {
    for (const signal of result.signals) {
      const detail = clean(`${signal.label} — ${signal.explanation}`) + (signal.evidence ? ` Evidence: "${clean(signal.evidence)}".` : "");
      const lines = doc.splitTextToSize(detail, CONTENT_W - 92) as string[];
      const block = Math.max(20, lines.length * 11 + 8);
      ensure(block + 6);
      const color: [number, number, number] = signal.severity === "critical" ? [200, 45, 45] : signal.severity === "high" ? [220, 110, 25] : signal.severity === "medium" ? [190, 130, 20] : [120, 110, 100];
      setText(7, "bold", color);
      doc.text(signal.severity.toUpperCase(), MARGIN, y + 8);
      setText(7.5, "normal", [140, 130, 120]);
      doc.text(`+${signal.weight}`, MARGIN + 52, y + 8);
      setText(8.5, "normal", [50, 45, 40]);
      lines.forEach((line, index) => doc.text(line, MARGIN + 92, y + 8 + index * 11));
      y += block;
      doc.setDrawColor(238, 232, 224);
      doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4);
    }
  }

  /* Recommendations */
  heading("What to do next");
  if (result.recommendations.length === 0) {
    paragraph("Verify any request for money or credentials through an official channel.", 9);
  } else {
    result.recommendations.forEach((recommendation, index) => {
      const lines = doc.splitTextToSize(clean(recommendation), CONTENT_W - 24) as string[];
      ensure(lines.length * 12 + 8);
      setText(9, "bold", [200, 100, 25]);
      doc.text(`${index + 1}.`, MARGIN, y + 7);
      setText(9, "normal", [55, 50, 45]);
      lines.forEach((line, lineIndex) => doc.text(line, MARGIN + 24, y + 7 + lineIndex * 12));
      y += lines.length * 12 + 6;
    });
  }

  /* Extracted + URL intel */
  const extracted = result.extracted;
  const extractedRows = (
    [
      ["Links", extracted.urls.join(", ")],
      ["Phone numbers", extracted.phoneNumbers.join(", ")],
      ["Emails", extracted.emails.join(", ")],
      ["Payment terms", extracted.paymentKeywords.join(", ")],
      ["Amounts", extracted.amounts.join(", ")],
      ["Brands", extracted.brands.join(", ")],
    ] as Array<[string, string]>
  ).filter(([, value]) => Boolean(value));

  if (extractedRows.length > 0) {
    heading("Extracted details");
    for (const [label, value] of extractedRows) {
      paragraph(`${label}: ${value}`, 8.5, [80, 72, 64]);
    }
  }

  if (result.url) {
    heading("Link and registry intel");
    paragraph(`URL (text only, never opened): ${result.url.normalized}`, 8.5, [80, 72, 64]);
    paragraph(`Registrable domain: ${result.url.registrableDomain} · TLD .${result.url.tld || "?"}`, 8.5, [80, 72, 64]);
    if (typeof result.domainIntel?.ageDays === "number") {
      paragraph(`Domain registered ${result.domainIntel.ageDays.toLocaleString("en-IN")} days ago (public WHOIS/RDAP record).`, 8.5, result.domainIntel.ageDays < 90 ? [170, 100, 20] : [80, 72, 64]);
    }
    const vt = result.threatIntel?.virusTotal;
    if (vt?.status === "ok") {
      paragraph(`VirusTotal: ${vt.malicious ?? 0} malicious and ${vt.suspicious ?? 0} suspicious out of ${vt.totalEngines ?? 0} engines.`, 8.5, (vt.malicious ?? 0) + (vt.suspicious ?? 0) > 0 ? [170, 40, 40] : [80, 72, 64]);
    }
    const geo = result.threatIntel?.ipGeo;
    if (geo?.status === "ok") {
      paragraph(`Hosting location (ipinfo, approximate): ${[geo.city, geo.country].filter(Boolean).join(", ")}${geo.org ? ` · ${geo.org}` : ""}.`, 8.5, [80, 72, 64]);
    }
    const ct = result.threatIntel?.ctLogs;
    if (ct?.status === "ok" && typeof ct.firstSeenDays === "number") {
      paragraph(`First public certificate: ${ct.firstSeenDays} days ago (Certificate Transparency).`, 8.5, ct.firstSeenDays < 30 ? [170, 100, 20] : [80, 72, 64]);
    }
    const shodan = result.threatIntel?.shodan;
    if (shodan?.status === "ok") {
      paragraph(`Shodan: ${shodan.ports?.length ?? 0} open ports, ${shodan.vulns?.length ?? 0} known CVEs on the hosting IP.`, 8.5, shodan.vulns?.length ? [170, 60, 40] : [80, 72, 64]);
    }
  }

  if (result.breach && result.breach.status !== "not_configured") {
    heading("Breach history (consented)");
    paragraph(result.breach.detail ?? "", 8.5);
    for (const breach of result.breach.breaches ?? []) {
      paragraph(`- ${breach.title}${breach.breachDate ? ` (${breach.breachDate})` : ""}`, 8.5, [80, 72, 64]);
    }
  }

  heading("Scope and privacy");
  paragraph(
    "This report was produced by FakeShield AI from the submitted text and the listed metadata sources. Links are parsed as text and are never loaded. Scores combine the rule engine with an optional Gemini semantic review. No result is a final security verdict; new scams can evade detection.",
    8.5,
    [110, 100, 90]
  );

  footer();
  const filename = reportFilename(result).replace(/\.json$/, ".pdf");
  doc.save(filename);
}
