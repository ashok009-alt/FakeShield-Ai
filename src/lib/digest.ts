import { risingAlerts, trendCategories, trendSummary } from "./data/trends";

/**
 * Weekly threat report email.
 *
 * Everything is env-gated: without SENDGRID_API_KEY and SENDGRID_FROM_EMAIL the
 * builder still works (useful for previews) but sending reports an honest
 * "not_configured" result instead of pretending an email went out.
 */

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

export function digestConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

export function siteUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";
  return value.replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DigestEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildWeeklyDigest(): DigestEmail {
  const week = trendSummary.weekLabel;
  const critical = trendSummary.criticalShare;
  const total = trendSummary.totalReports.toLocaleString("en-IN");
  const top = trendCategories.slice(0, 4);
  const rising = risingAlerts.slice(0, 3);
  const subject = `FakeShield AI weekly threat report — ${week}`;

  const text = [
    `FakeShield AI weekly threat report`,
    week,
    "",
    `${total} reports were analysed this week. ${critical}% were critical, and the most reported state was ${trendSummary.topState}.`,
    "",
    "Fastest risers:",
    ...rising.map((alert) => `- ${alert.title}: +${alert.change}% — ${alert.detail}`),
    "",
    "Scam types this week:",
    ...top.map(
      (category) =>
        `- ${category.name}: ${category.reports.toLocaleString("en-IN")} reports (${
          category.change >= 0 ? "+" : ""
        }${category.change}%)`
    ),
    "",
    "One habit that blocks most of these: never share an OTP, PIN or password with someone who contacted you. Banks do not ask for them.",
    "",
    "Check a suspicious message: " + `${siteUrl()}/analyze`,
    "",
    "FakeShield AI provides risk guidance, not a final security verdict.",
    "Illustrative trend data for this demo; it is not a live feed from cybercrime.gov.in.",
    "",
    "Unsubscribe: " + `${siteUrl()}/api/digest/unsubscribe?email={{email}}`,
  ].join("\n");

  const risingRows = rising
    .map(
      (alert) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee7de;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#2a1d12;">${escapeHtml(
            alert.title
          )} <span style="color:#c2410c;">+${alert.change}%</span></p>
          <p style="margin:3px 0 0;font-size:12px;line-height:18px;color:#6b5b4c;">${escapeHtml(
            alert.detail
          )}</p>
        </td>
      </tr>`
    )
    .join("");

  const categoryRows = top
    .map(
      (category) => `
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#3b2b1d;">${escapeHtml(category.name)}</td>
        <td style="padding:7px 0;font-size:13px;color:#6b5b4c;text-align:right;font-variant-numeric:tabular-nums;">${category.reports.toLocaleString(
          "en-IN"
        )}</td>
        <td style="padding:7px 0 7px 16px;font-size:12px;text-align:right;color:${
          category.change >= 0 ? "#c2410c" : "#047857"
        };">${category.change >= 0 ? "+" : ""}${category.change}%</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px 12px;background:#f6f1ea;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #efe6da;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background:#1a130d;padding:22px 24px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#fdba74;">FakeShield AI</p>
          <h1 style="margin:6px 0 0;font-size:21px;line-height:28px;color:#fff7ed;">Weekly threat report</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#c9b6a4;">${escapeHtml(week)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px 8px;">
          <p style="margin:0;font-size:13px;line-height:21px;color:#3b2b1d;">
            <strong>${total}</strong> reports were analysed this week. <strong>${critical}%</strong> were critical.
            The most reported state was <strong>${escapeHtml(trendSummary.topState)}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px 4px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a1907f;">Rising now</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${risingRows}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 6px;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a1907f;">Scam types</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${categoryRows}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px;">
          <div style="border:1px solid #f0c9a8;background:#fff7ed;border-radius:10px;padding:14px 16px;">
            <p style="margin:0;font-size:13px;line-height:20px;color:#7c2d12;">
              <strong>One habit that blocks most of these:</strong> never share an OTP, PIN or password with someone who contacted you. Banks do not ask for them.
            </p>
          </div>
          <p style="margin:18px 0 0;">
            <a href="${siteUrl()}/analyze" style="display:inline-block;background:#ea580c;color:#fff7ed;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">Check a suspicious message</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 22px;border-top:1px solid #eee7de;">
          <p style="margin:0;font-size:11px;line-height:17px;color:#8a7a6a;">
            FakeShield AI provides risk guidance, not a final security verdict.<br />
            Illustrative trend data for this demo; not a live feed from cybercrime.gov.in.
          </p>
          <p style="margin:8px 0 0;font-size:10px;color:#a1907f;">
            <a href="${siteUrl()}/api/digest/unsubscribe?email={{email}}" style="color:#a1907f;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export interface SendResult {
  ok: boolean;
  status: "sent" | "not_configured" | "error";
  statusCode?: number;
  error?: string;
}

export async function sendWeeklyDigest(to: string): Promise<SendResult> {
  if (!digestConfigured()) {
    return {
      ok: false,
      status: "not_configured",
      error: "SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are not set.",
    };
  }

  const email = buildWeeklyDigest();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL as string;
  const fromName = process.env.SENDGRID_FROM_NAME?.trim() || "FakeShield AI";
  const replyTo = process.env.SENDGRID_REPLY_TO?.trim();

  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail, name: fromName },
    ...(replyTo ? { reply_to: { email: replyTo } } : {}),
    subject: email.subject,
    content: [
      { type: "text/plain", value: email.text.replace("{{email}}", encodeURIComponent(to)) },
      { type: "text/html", value: email.html.replace("{{email}}", encodeURIComponent(to)) },
    ],
    tracking_settings: {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: false },
    },
  };

  try {
    const response = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        status: "error",
        statusCode: response.status,
        error: detail.slice(0, 300) || "SendGrid rejected the message.",
      };
    }
    return { ok: true, status: "sent", statusCode: response.status };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      error: error instanceof Error ? error.message : "SendGrid request failed.",
    };
  }
}
