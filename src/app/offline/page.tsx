import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline quick check",
  description:
    "A local, browser-only pattern check for suspicious messages when FakeShield cannot reach the server.",
};

/**
 * Fully self-contained page: inline styles and an inline script, no framework
 * chunks. The service worker precaches this HTML, so the quick check keeps
 * working with no network. It is deliberately honest about being a small
 * subset of the real engine.
 */
const CHECKER_SCRIPT = `
(function () {
  var rules = [
    { re: /\\b(otp|one[\\s-]?time (password|code)|verification code|sms code)\\b/i, w: 26, label: 'Asks for a one-time code' },
    { re: /\\b(share|send|read|forward|tell|give|provide)\\b[^.]{0,30}\\b(otp|code|pin|password)\\b/i, w: 24, label: 'Asks you to share a code or PIN' },
    { re: /\\b(pin|password|cvv|card number|net ?banking (id|password))\\b/i, w: 20, label: 'Mentions passwords or card details' },
    { re: /\\b(account|card|service)\\s+(will be|has been|is)\\s+(blocked|suspended|frozen|closed)\\b/i, w: 18, label: 'Threatens to block your account' },
    { re: /\\b(immediately|right away|at once|act now|within \\d+ (minutes|hours)|last warning|final warning)\\b/i, w: 14, label: 'Uses urgency' },
    { re: /\\b(kyc|re-?kyc|update your (details|kyc)|aadhaar|aadhar|pan card)\\b/i, w: 14, label: 'KYC or identity-document request' },
    { re: /\\b(pay|payment|transfer|send money|deposit|collect request)\\b/i, w: 14, label: 'Asks for a payment' },
    { re: /\\b(upi|gpay|phonepe|paytm|scan (this |the )?qr|qr code)\\b/i, w: 12, label: 'UPI or QR payment reference' },
    { re: /\\b(winner|you have won|prize|lottery|lucky draw|congratulations,? you)\\b/i, w: 18, label: 'Prize or lottery claim' },
    { re: /\\b(investment|trading|bitcoin|crypto|guaranteed returns?|double your (money|investment))\\b/i, w: 16, label: 'Investment or crypto lure' },
    { re: /\\b(work from home|part[- ]time job|daily payout|no experience (needed|required)|simple tasks?)\\b/i, w: 12, label: 'Fake job or task offer' },
    { re: /\\b(delivery fee|customs fee|courier fee|parcel (held|stuck|on hold))\\b/i, w: 14, label: 'Delivery-fee trap' },
    { re: /\\b(arrest|police|fir|court notice|legal action|digital arrest|cbi)\\b/i, w: 18, label: 'Arrest or legal threat' },
    { re: /\\b(gift card|itunes card|amazon card|steam card|voucher code)\\b/i, w: 18, label: 'Gift-card payment request' },
    { re: /\\b(do not (tell|inform)|keep (this|it) confidential|between us)\\b/i, w: 16, label: 'Asks for secrecy' },
    { re: /\\b(anydesk|teamviewer|quick ?support|screen shar(e|ing)|remote access)\\b/i, w: 20, label: 'Remote-access request' },
    { re: /https?:\\/\\/[^\\s]+/i, w: 6, label: 'Contains a link' },
    { re: /\\b(bit\\.ly|tinyurl|t\\.co|rb\\.gy|is\\.gd|shorturl)\\b/i, w: 12, label: 'Uses a link shortener' }
  ];

  var text = document.getElementById('oq-text');
  var button = document.getElementById('oq-check');
  var output = document.getElementById('oq-output');
  if (!text || !button || !output) return;

  function levelFor(score) {
    if (score >= 75) return { name: 'Critical', color: '#f87171', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' };
    if (score >= 50) return { name: 'High', color: '#fb923c', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)' };
    if (score >= 25) return { name: 'Medium', color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' };
    return { name: 'Low', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' };
  }

  function analyze() {
    var value = text.value.trim();
    if (value.length < 10) {
      output.innerHTML = '<p class="oq-hint">Paste at least 10 characters so there is something to check.</p>';
      return;
    }
    var hits = [];
    var raw = 0;
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].re.test(value)) {
        hits.push(rules[i]);
        raw += rules[i].w;
      }
    }
    var score = raw === 0 ? 0 : Math.min(100, Math.round(100 * (1 - Math.exp(-raw / 40))));
    var level = levelFor(score);
    var list = hits.length
      ? hits.map(function (hit) { return '<li>' + hit.label + '</li>'; }).join('')
      : '<li>No local pattern matched.</li>';
    output.innerHTML =
      '<div class="oq-verdict" style="background:' + level.bg + ';border-color:' + level.border + '">' +
        '<span class="oq-score" style="color:' + level.color + '">' + score + '</span>' +
        '<div><p class="oq-level" style="color:' + level.color + '">' + level.name.toUpperCase() + ' RISK</p>' +
        '<p class="oq-small">Small local ruleset only. This is not the full FakeShield engine.</p></div>' +
      '</div>' +
      '<ul class="oq-list">' + list + '</ul>' +
      '<p class="oq-small">Never share an OTP, PIN or password. Verify through the organisation\\u2019s official app. In India, report fraud at cybercrime.gov.in or 1930.</p>';
  }

  button.addEventListener('click', analyze);
  text.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      analyze();
    }
  });
})();
`;

export default function OfflinePage() {
  return (
    <div className="page-shell py-14 sm:py-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.oq-wrap{max-width:720px;margin:0 auto;color:#e7e5e4;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.oq-card{background:linear-gradient(145deg,rgba(28,20,12,.97),rgba(15,9,6,.99));border:1px solid rgba(251,146,60,.18);border-radius:18px;padding:26px;box-shadow:0 30px 80px -50px #000}
.oq-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fb923c;font-weight:700}
.oq-h1{font-size:24px;line-height:1.25;font-weight:800;color:#fff;margin:10px 0 6px}
.oq-p{font-size:13px;line-height:1.7;color:#a8a29e;margin:0 0 18px}
.oq-label{display:block;font-size:12px;font-weight:700;color:#d6d3d1;margin-bottom:8px}
.oq-text{width:100%;min-height:150px;resize:vertical;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.10);border-radius:12px;color:#f5f5f4;padding:12px;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;outline:none;box-sizing:border-box}
.oq-text:focus{border-color:rgba(251,146,60,.55);box-shadow:0 0 0 3px rgba(251,146,60,.12)}
.oq-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px}
.oq-btn{appearance:none;border:1px solid rgba(251,146,60,.45);background:#f97316;color:#1a0f08;font-weight:800;font-size:13px;border-radius:999px;padding:9px 18px;cursor:pointer}
.oq-btn:hover{background:#fb923c}
.oq-hint{font-size:11px;color:#78716c;margin:0}
.oq-verdict{display:flex;align-items:center;gap:16px;border:1px solid;border-radius:14px;padding:16px;margin-top:20px}
.oq-score{font-size:40px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
.oq-level{font-size:11px;font-weight:800;letter-spacing:.14em;margin:0}
.oq-small{font-size:10.5px;line-height:1.6;color:#78716c;margin:4px 0 0}
.oq-list{margin:14px 0 12px;padding:0;list-style:none;display:grid;gap:6px}
.oq-list li{font-size:12px;line-height:1.5;color:#d6d3d1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:7px 10px}
.oq-foot{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);font-size:11px;line-height:1.7;color:#78716c}
.oq-foot a{color:#fdba74}
@media (max-width:520px){.oq-card{padding:18px}.oq-h1{font-size:20px}}
`,
        }}
      />
      <div className="oq-wrap">
        <div className="oq-card">
          <p className="oq-kicker">
            <WifiOff className="size-3.5" />
            Offline · local only
          </p>
          <h1 className="oq-h1">Quick check without a connection</h1>
          <p className="oq-p">
            FakeShield cannot reach its server right now, so the full engine, AI review and threat
            feeds are unavailable. This page runs a small pattern check entirely in your browser —
            nothing is uploaded, saved or sent anywhere.
          </p>

          <label className="oq-label" htmlFor="oq-text">
            Paste the suspicious message
          </label>
          <textarea
            id="oq-text"
            className="oq-text"
            maxLength={6000}
            spellCheck={false}
            placeholder="Paste an SMS, WhatsApp message or email text…"
          />
          <div className="oq-actions">
            <button id="oq-check" className="oq-btn" type="button">
              Run offline check
            </button>
            <span className="oq-hint">17 local patterns · no network</span>
          </div>

          <div id="oq-output" aria-live="polite" />

          <p className="oq-foot">
            This is a first look, not a verdict. The online analyzer adds link parsing, sender
            checks, domain and certificate history, threat feeds and an AI review.{" "}
            <Link href="/analyze">Open the full analyzer when you are back online</Link>. Report
            cyber fraud in India at cybercrime.gov.in or on 1930.
          </p>
          <noscript>
            <p className="oq-p" style={{ marginTop: 14 }}>
              JavaScript is required for the offline checker. The rest of FakeShield needs a network
              connection anyway.
            </p>
          </noscript>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: CHECKER_SCRIPT }} />
    </div>
  );
}
