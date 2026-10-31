import type { AnalysisResult, RiskLevel } from "./analysis/types";

const PALETTE: Record<RiskLevel, { accent: string; soft: string; label: string }> = {
  Low: { accent: "#34d399", soft: "rgba(52,211,153,0.18)", label: "LOW RISK" },
  Medium: { accent: "#fbbf24", soft: "rgba(251,191,36,0.2)", label: "MEDIUM RISK" },
  High: { accent: "#fb923c", soft: "rgba(251,146,60,0.22)", label: "HIGH RISK" },
  Critical: { accent: "#f87171", soft: "rgba(248,113,113,0.22)", label: "CRITICAL RISK" },
};

const W = 1080;
const H = 1350;
const M = 74;

export interface ShareCardOptions {
  host?: string;
  generatedAt?: Date;
}

/** Renders a 1080×1350 PNG share card entirely on the client. */
export async function renderShareCard(
  result: AnalysisResult,
  options: ShareCardOptions = {}
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  const palette = PALETTE[result.riskLevel];
  const generatedAt = options.generatedAt ?? new Date();
  const host =
    options.host ??
    (typeof window !== "undefined" ? window.location.host : "FakeShield AI");

  // Background
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, "#120b06");
  bg.addColorStop(0.55, "#0b0704");
  bg.addColorStop(1, "#1a0f08");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent glow behind the score
  const glow = ctx.createRadialGradient(W / 2, 470, 40, W / 2, 470, 520);
  glow.addColorStop(0, palette.soft);
  glow.addColorStop(0.6, "rgba(251,146,60,0.04)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle deterministic grain
  let seed = 1337 + result.riskScore * 31;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let index = 0; index < 900; index += 1) {
    const x = random() * W;
    const y = random() * H;
    const alpha = random() * 0.05;
    ctx.fillStyle = `rgba(255,236,214,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Frame
  ctx.strokeStyle = "rgba(251,146,60,0.18)";
  ctx.lineWidth = 2;
  roundRect(ctx, M / 2, M / 2, W - M, H - M, 40, false, true);

  // Header
  drawShield(ctx, M + 6, M + 4, 46, palette.accent);
  ctx.fillStyle = "#f3e8dc";
  ctx.font = "700 26px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  spacedText(ctx, "FAKESHIELD AI", M + 68, M + 28, 5);
  ctx.fillStyle = "#8a7461";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  spacedText(ctx, "THREAT CARD", M + 68, M + 58, 4);

  ctx.textAlign = "right";
  ctx.fillStyle = "#8a7461";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText(formatCardDate(generatedAt), W - M - 4, M + 30);

  // Score ring
  const cx = W / 2;
  const cy = 470;
  const radius = 212;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  const arcEnd = -Math.PI / 2 + (Math.max(2, result.riskScore) / 100) * Math.PI * 2;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, arcEnd);
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.strokeStyle = palette.soft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 210px Inter, system-ui, sans-serif";
  ctx.fillText(String(result.riskScore), cx, cy + 6);
  ctx.fillStyle = "#8a7461";
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  spacedText(ctx, "RISK SCORE / 100", cx, cy + 158, 5);

  ctx.fillStyle = palette.accent;
  ctx.font = "700 44px Inter, system-ui, sans-serif";
  spacedText(ctx, palette.label, cx, cy + 272, 6);

  // Summary
  ctx.fillStyle = "#e7d8c8";
  ctx.font = "400 31px Inter, system-ui, sans-serif";
  const summary = wrapText(ctx, result.summary, W - 2 * M - 40, 3);
  let y = 900;
  for (const line of summary) {
    ctx.fillText(line, cx, y);
    y += 46;
  }

  // Signals
  const signals = result.signals.slice(0, 3);
  y = 1030;
  if (signals.length > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M + 20, y - 26);
    ctx.lineTo(W - M - 20, y - 26);
    ctx.stroke();

    for (const signal of signals) {
      ctx.textAlign = "left";
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(M + 26, y + 10, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e7d8c8";
      ctx.font = "500 27px Inter, system-ui, sans-serif";
      const label = truncateToWidth(ctx, signal.label, 640);
      ctx.fillText(label, M + 46, y + 10);

      ctx.textAlign = "right";
      ctx.fillStyle = "#8a7461";
      ctx.font = "500 20px Inter, system-ui, sans-serif";
      ctx.fillText(signal.severity.toUpperCase(), W - M - 24, y + 10);
      y += 52;
    }
  }

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#8a7461";
  ctx.font = "500 21px Inter, system-ui, sans-serif";
  ctx.fillText(
    "FakeShield AI provides risk guidance, not a final security verdict.",
    cx,
    H - M - 58
  );
  ctx.fillStyle = "#5f4f40";
  ctx.font = "500 19px Inter, system-ui, sans-serif";
  ctx.fillText(
    `${result.inputType.toUpperCase()} · ${Math.round(result.confidence * 100)}% confidence · ${host}`,
    cx,
    H - M - 26
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the share image."));
    }, "image/png");
  });
}

function drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(size / 2, 2);
  ctx.lineTo(size - 4, size * 0.2);
  ctx.lineTo(size - 4, size * 0.52);
  ctx.quadraticCurveTo(size - 4, size * 0.86, size / 2, size - 2);
  ctx.quadraticCurveTo(4, size * 0.86, 4, size * 0.52);
  ctx.lineTo(4, size * 0.2);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(251,146,60,0.1)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.32, size * 0.5);
  ctx.lineTo(size * 0.45, size * 0.64);
  ctx.lineTo(size * 0.7, size * 0.36);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  const characters = [...text];
  const width =
    characters.reduce((total, character) => total + ctx.measureText(character).width, 0) +
    spacing * (characters.length - 1);
  let cursor = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  for (const character of characters) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + spacing;
  }
  ctx.textAlign = align;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth) {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  const total = lines.join(" ");
  if (total.length < text.length && lines.length > 0) {
    lines[lines.length - 1] = truncateToWidth(ctx, `${lines[lines.length - 1]}…`, maxWidth);
  }
  return lines;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 3 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}…`;
}

function formatCardDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
