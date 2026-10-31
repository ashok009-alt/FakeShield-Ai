import { extractEntities, extractUrls } from "./extract";
import { buildAssessment } from "./riskScoring";
import { makeSignal } from "./signalExplanations";
import { DISCLAIMER, type AnalysisResult, type Signal } from "./types";
import { quickUrlSignals } from "./urlAnalyzer";

interface Rule {
  id: string;
  test: (text: string) => string | false | undefined;
}

function fromRegex(id: string, pattern: RegExp): Rule {
  return {
    id,
    test: (text) => {
      const match = text.match(pattern);
      return match ? match[0] : false;
    },
  };
}

const BASIC_RULES: Rule[] = [
  // Urgency
  fromRegex(
    "urgency_immediate",
    /\b(immediately|right away|at once|asap|without delay|act now|within \d{1,2}\s?(minutes|hours)|within 24 hours|within 48 hours|last warning|final warning|expires? (today|in \d+ (hours|minutes)))\b/i
  ),
  fromRegex(
    "account_threat",
    /\b(account|card|service|policy)\s+(will be|has been|is|was)\s+(blocked|suspended|deactivated|frozen|closed|terminated)\b|\bblock(ed)? (your|the) account\b/i
  ),
  fromRegex(
    "limited_offer",
    /\b(today only|last chance|limited[- ]time|limited offer|offer expires|hurry|few slots left)\b/i
  ),

  // Fear
  fromRegex(
    "legal_threat",
    /\b(legal action|lawsuit|court|court notice|police complaint|fir|arrest|criminal case|cyber cell|penalty|fine of)\b/i
  ),
  fromRegex(
    "fraud_alert",
    /\b(fraud(ulent)? (activity|transaction)|suspicious (activity|login|transaction)|unauthori[sz]ed (access|transaction|debit))\b/i
  ),
  fromRegex("fear_language", /\b(security alert|warning\s*:|risk of losing|danger)\b/i),

  // Financial bait
  fromRegex(
    "payment_request",
    /\b(pay|payment|transfer|send money|remit|deposit)\b/i
  ),
  fromRegex("refund_bait", /\b(refund|cashback|reimburse|money back)\b/i),
  fromRegex(
    "prize_bait",
    /\b(winner|you have won|prize|lottery|lucky draw|jackpot|congratulations,? you)\b/i
  ),
  fromRegex(
    "investment_bait",
    /\b(investment|invest|trading|stock tips?|mutual funds?|bitcoin|crypto(currency)?|usdt|forex|guaranteed returns?|double your (money|investment)|profit (assured|guaranteed))\b/i
  ),
  fromRegex(
    "gift_card_request",
    /\b(gift card|itunes card|amazon card|steam card|google play card|voucher code)\b/i
  ),
  fromRegex(
    "upi_payment",
    /\b(upi|gpay|google pay|phonepe|paytm|collect request|payment request|scan (this |the )?qr|qr code)\b/i
  ),
  fromRegex("amount_mention", /(?:₹|rs\.?|inr|\$|usd|£|€)\s?\d[\d,]*(?:\.\d{1,2})?/i),

  // Credentials
  fromRegex(
    "otp_request",
    /\b(otp|one[- ]time password|verification code|6[- ]digit code|sms code)\b/i
  ),
  fromRegex(
    "credential_request",
    /\b(pin|password|cvv|card number|debit card|credit card|net ?banking (id|password)|internet banking (id|password))\b/i
  ),
  fromRegex(
    "kyc_request",
    /\b(kyc|know your customer|re-?verify|re-?kyc|update your (details|information|kyc)|pan card|aadhaar|aadhar|selfie verification)\b/i
  ),
  fromRegex(
    "share_details",
    /\b(share|send|provide|confirm)\s+(your\s+)?(details|information|credentials|documents|account number|date of birth)\b/i
  ),
  fromRegex(
    "remote_access",
    /\b(anydesk|teamviewer|quick ?support|remote (access|desktop)|screen shar(e|ing))\b/i
  ),
  fromRegex(
    "install_app",
    /\b(install|download)\s+(the\s+|this\s+)?(app|apk|application|software)\b/i
  ),

  // Impersonation
  fromRegex(
    "bank_reference",
    /\b(sbi|state bank|hdfc|icici|axis bank|kotak|pnb|punjab national|bank of baroda|canara|union bank|yes bank|idfc|bank)\b/i
  ),
  fromRegex(
    "gov_reference",
    /\b(income tax|it department|govt|government|customs|traffic (challan|police)|cbdt|epfo|uidai|passport office|municipal corporation)\b/i
  ),
  fromRegex("police_reference", /\b(police|cyber crime|cyber cell|cbi|enforcement directorate|digital arrest)\b/i),
  fromRegex(
    "delivery_reference",
    /\b(amazon|flipkart|fedex|dhl|blue ?dart|india post|speed post|courier|parcel|shipment)\b/i
  ),
  fromRegex(
    "brand_reference",
    /\b(paypal|microsoft|google|apple|netflix|whatsapp|facebook|instagram|linkedin|paytm|phonepe|amazon|flipkart)\b/i
  ),
  fromRegex("customer_care_reference", /\b(customer care|customer support|help ?desk|helpline)\b/i),
  fromRegex(
    "authority_claim",
    /\b(official (notice|communication|alert)|from the desk of|authori[sz]ed by|this is an (official|final) notice)\b/i
  ),

  // Requests
  fromRegex(
    "link_click_request",
    /\b(click|tap|open|visit)\s+(the\s+|this\s+)?(link|here|below|button)\b|\bclick here\b/i
  ),
  fromRegex(
    "call_request",
    /\b(call|dial|ring)\b[^.]{0,25}?(\+?\d[\d\s-]{7,}|\d{3,5}[\s-]?\d{5,})/i
  ),
  fromRegex("qr_request", /\b(scan|scanning)\s+(this|the|below)\s+qr\b|\bqr code (to (pay|receive|verify))\b/i),
  fromRegex(
    "reply_request",
    /\b(reply (with|to)|confirm (by|via) (replying|sms)|respond (with|to) (this|the))\b/i
  ),

  // Formatting
  fromRegex("repeated_punctuation", /[!?]{3,}/),
  fromRegex("odd_spacing", /(?:\b[A-Za-z]\s){4,}[A-Za-z]\b/),
  fromRegex(
    "grammar_anomalies",
    /\b(recieve|acount|verfy|immediatly|officail|passward|bankk|kindly do the needful|please do the needful)\b/i
  ),
  fromRegex(
    "lookalike_brand",
    /\b(paypa1|amaz0n|g00gle|micr0soft|netfl1x|faceb00k|wh4tsapp|1cici|5bi|axisb4nk)\b/i
  ),
  fromRegex(
    "secrecy_request",
    /\b(do not (tell|inform|share with) (anyone|your (family|bank))|keep (this|it) confidential|between us)\b/i
  ),
];

const CONTEXT_ONLY_SIGNALS = new Set([
  "bank_reference",
  "brand_reference",
  "delivery_reference",
  "customer_care_reference",
  "fear_language",
  "amount_mention",
]);

const DELIVERY_FEE_PATTERN =
  /\b(delivery|customs|shipping|courier)\s+(fee|charge|payment|failed|pending)\b|\b(parcel|package|shipment|courier)\b[^.]{0,40}\b(held|stuck|on hold|failed|reschedule|customs)\b/i;

const JOB_PATTERN =
  /\b(work from home|earn (up to )?₹?\s?\d[\d,]*|per day|daily payout|part[- ]time job|hiring now|job offer|salary|no experience (needed|required)|simple tasks?)\b/i;

const INVESTMENT_GROUP_PATTERN =
  /\b(telegram|whatsapp)\s+(group|channel)|join (our|the) (group|channel)|expert mentor|profit (guaranteed|assured)|\d+%\s+(daily|monthly) returns?\b/i;

const BANK_ALERT_PATTERN =
  /\b(debit alert|transaction alert|your card (was|is) used|account (debited|credited) by|rs\.?\s?\d+ (debited|credited))\b/i;

const PRIZE_PATTERN =
  /\b(you have won|congratulations[,!]? you|claim (your )?(prize|reward)|click to claim|selected (as a )?winner)\b/i;

const SUPPORT_PATTERN =
  /\b(your (account|device|computer|phone) (has|is) (been )?(hacked|infected|compromised)|virus detected|microsoft support|call (this|our) (support|helpline)|bank account (has been )?hacked)\b/i;

function runBasicRules(text: string): Signal[] {
  const signals: Signal[] = [];

  for (const rule of BASIC_RULES) {
    const evidence = rule.test(text);
    if (evidence) {
      const signal = makeSignal(rule.id, evidence);
      if (signal) signals.push(signal);
    }
  }

  const letters = text.replace(/[^A-Za-z]/g, "");
  const uppercase = text.replace(/[^A-Z]/g, "");
  if (letters.length >= 24 && uppercase.length / letters.length >= 0.5) {
    const sample = text.match(/[A-Z][A-Z\s!]{10,}/)?.[0];
    const signal = makeSignal("all_caps", sample);
    if (signal) signals.push(signal);
  }

  return signals;
}

function addConditionalRules(text: string, signals: Signal[]): void {
  const lower = text.toLowerCase();
  const ids = new Set(signals.map((signal) => signal.id));
  const push = (id: string, evidence?: string) => {
    const signal = makeSignal(id, evidence);
    if (signal && !ids.has(id)) {
      signals.push(signal);
      ids.add(id);
    }
  };

  if (
    ids.has("kyc_request") &&
    (ids.has("urgency_immediate") ||
      ids.has("account_threat") ||
      ids.has("link_click_request") ||
      ids.has("call_request"))
  ) {
    push("fake_kyc_pattern", "KYC request combined with urgency or a contact request");
  }

  if (DELIVERY_FEE_PATTERN.test(text)) push("delivery_fee_pattern");

  if (JOB_PATTERN.test(text) && /(job|work|hiring|earn|salary|task)/i.test(lower)) {
    push("job_offer_pattern");
  }

  if (INVESTMENT_GROUP_PATTERN.test(text)) push("investment_group_pattern");

  if (BANK_ALERT_PATTERN.test(text)) push("bank_alert_pattern");

  if (PRIZE_PATTERN.test(text)) push("prize_pattern");

  if (SUPPORT_PATTERN.test(text)) push("support_scam_pattern");
}

export function collectMessageSignals(text: string): Signal[] {
  const signals = runBasicRules(text);
  addConditionalRules(text, signals);

  const urls = extractUrls(text);
  if (urls.length >= 3) {
    const signal = makeSignal("many_links", `${urls.length} links`);
    if (signal) signals.push(signal);
  }

  const seenLinkIds = new Set<string>();
  for (const url of urls) {
    for (const linkSignal of quickUrlSignals(url)) {
      if (seenLinkIds.has(linkSignal.id)) continue;
      seenLinkIds.add(linkSignal.id);
      signals.push({ ...linkSignal, evidence: url });
    }
  }

  // Weak context words (bank, brand, delivery, “pay”) should not raise the
  // alarm on an otherwise ordinary message. They only count once a strong
  // signal is present.
  const hasStrongSignal = signals.some(
    (signal) => signal.severity === "high" || signal.severity === "critical"
  );
  if (!hasStrongSignal) {
    return signals.filter((signal) => !CONTEXT_ONLY_SIGNALS.has(signal.id));
  }

  return signals;
}

export function analyzeMessage(text: string): AnalysisResult {
  const trimmed = text.trim();
  const signals = collectMessageSignals(trimmed);
  const extracted = extractEntities(trimmed);

  const assessment = buildAssessment({
    inputType: "message",
    signals,
    extracted,
    textLength: trimmed.length,
  });

  return {
    ...assessment,
    inputType: "message",
    extracted,
    disclaimer: DISCLAIMER,
  };
}
