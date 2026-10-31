import { extractUrls } from "./extract";
import type { OfficialDomainCheck, OtpExposure } from "./types";

/**
 * Fully local checks: no network, no third-party API.
 *
 *  - official-domain: compares a claimed brand against its real registrable
 *    domains whenever the input contains a link or a sender address;
 *  - OTP exposure: reports that a message asks for (or contains) a one-time
 *    code without ever echoing the digits back.
 */

interface Brand {
  brand: string;
  aliases: RegExp[];
  officialDomains: string[];
  note?: string;
}

export const OFFICIAL_BRANDS: Brand[] = [
  { brand: "State Bank of India", aliases: [/\bsbi\b/i, /state bank/i], officialDomains: ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "sbiyono.sbi"] },
  { brand: "HDFC Bank", aliases: [/\bhdfc\b/i], officialDomains: ["hdfcbank.com", "hdfc.com"] },
  { brand: "ICICI Bank", aliases: [/\bicici\b/i], officialDomains: ["icicibank.com"] },
  { brand: "Axis Bank", aliases: [/\baxis bank\b/i], officialDomains: ["axisbank.com"] },
  { brand: "Kotak Mahindra Bank", aliases: [/\bkotak\b/i], officialDomains: ["kotak.com"] },
  { brand: "Punjab National Bank", aliases: [/\bpnb\b/i, /punjab national/i], officialDomains: ["pnbindia.in", "pnb.bank.in"] },
  { brand: "Reserve Bank of India", aliases: [/\brbi\b/i, /reserve bank of india/i], officialDomains: ["rbi.org.in"] },
  { brand: "NPCI / UPI", aliases: [/\bnpci\b/i, /\bupi\b/i, /unified payments/i], officialDomains: ["npci.org.in", "upi.npci.org.in", "bhimupi.org.in"], note: "NPCI never calls or messages users to “reactivate” UPI IDs." },
  { brand: "UIDAI / Aadhaar", aliases: [/\buidai\b/i, /aadhaar/i, /aadhar/i], officialDomains: ["uidai.gov.in", "eaadhaar.uidai.gov.in", "myaadhaar.uidai.gov.in"], note: "UIDAI never asks for your Aadhaar OTP over phone, SMS or WhatsApp." },
  { brand: "Income Tax Department", aliases: [/income tax/i, /\bit department\b/i, /\bcbdt\b/i], officialDomains: ["incometax.gov.in", "incometaxindia.gov.in"] },
  { brand: "IRCTC", aliases: [/\birctc\b/i], officialDomains: ["irctc.co.in", "irctc.com"] },
  { brand: "Amazon", aliases: [/\bamazon\b/i], officialDomains: ["amazon.in", "amazon.com"] },
  { brand: "Flipkart", aliases: [/\bflipkart\b/i], officialDomains: ["flipkart.com"] },
  { brand: "Paytm", aliases: [/\bpaytm\b/i], officialDomains: ["paytm.com", "paytmbank.com"] },
  { brand: "PhonePe", aliases: [/\bphonepe\b/i], officialDomains: ["phonepe.com"] },
  { brand: "Google Pay", aliases: [/\bgoogle pay\b/i, /\bgpay\b/i], officialDomains: ["pay.google.com", "google.com"] },
];

function hostOf(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function emailDomain(value: string): string | null {
  const at = value.lastIndexOf("@");
  if (at < 0) return null;
  return value.slice(at + 1).toLowerCase().trim() || null;
}

function matchesOfficial(host: string, domains: string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export interface OfficialDomainOptions {
  /** Sender address, for the email analyzer. Never sent anywhere. */
  senderEmail?: string;
}

/**
 * Returns a finding only when the text claims a brand and also points at a
 * link (or sender domain) that is not on that brand's real domain list.
 * A bare mention of a bank in an ordinary message is not flagged.
 */
export function checkOfficialDomains(
  text: string,
  options: OfficialDomainOptions = {}
): OfficialDomainCheck | null {
  const textDomains = extractUrls(text)
    .map(hostOf)
    .filter((host): host is string => Boolean(host));
  const sender = options.senderEmail ? emailDomain(options.senderEmail) : null;
  const observed = [...new Set([...textDomains, ...(sender ? [sender] : [])])];

  for (const entry of OFFICIAL_BRANDS) {
    if (!entry.aliases.some((alias) => alias.test(text))) continue;
    if (observed.length === 0) continue;

    const official = observed.filter((host) => matchesOfficial(host, entry.officialDomains));
    const foreign = observed.filter((host) => !matchesOfficial(host, entry.officialDomains));

    if (foreign.length === 0) {
      return {
        brand: entry.brand,
        claimedAs: entry.brand,
        officialDomains: entry.officialDomains,
        observedDomain: official[0] ?? null,
        mismatch: false,
        detail: `The link uses an official ${entry.brand} domain. Check the rest of the message before trusting it — a real domain can still be misused in a scam.`,
      };
    }

    return {
      brand: entry.brand,
      claimedAs: entry.brand,
      officialDomains: entry.officialDomains,
      observedDomain: foreign[0],
      mismatch: true,
      detail: `This input mentions ${entry.brand} but points to ${foreign
        .slice(0, 2)
        .join(" and ")}, which is not an official ${entry.brand} domain.${entry.note ? ` ${entry.note}` : ""}`,
    };
  }

  return null;
}

const OTP_TERMS =
  /\b(otp|one[\s-]?time (password|code)|verification code|security code|sms code|auth(?:entication)? code|2fa code|login code)\b/i;

const SHARE_VERB =
  /\b(share|send|tell|give|forward|provide|reply with|enter|type|confirm)\b/i;

const CODE_SEQUENCE = /(?<![\d₹$])(\d{4,8})(?![\d%])/g;

export function detectOtp(text: string): OtpExposure {
  const requests = OTP_TERMS.test(text);
  const codes = [...text.matchAll(CODE_SEQUENCE)].map((match) => match[1]);
  // A year or a short amount should not read as a code.
  const plausible = codes.filter((code) => !/^(19|20)\d{2}$/.test(code));
  const codeDetected = plausible.length > 0;
  const asksToShare = requests && SHARE_VERB.test(text);

  if (requests && (codeDetected || asksToShare)) {
    return {
      requested: true,
      codeDetected,
      codeLength: plausible[0]?.length,
      detail:
        "This message asks for a one-time code. Your bank, UPI app, courier and government offices never ask you to share an OTP — not even to “verify” or “cancel” a payment. Never read it out or forward it.",
    };
  }

  if (requests) {
    return {
      requested: true,
      codeDetected: false,
      detail:
        "This message refers to an OTP or verification code. Treat any request to share one as fraud; the code is the last key to your account.",
    };
  }

  if (codeDetected) {
    return {
      requested: false,
      codeDetected: true,
      codeLength: plausible[0]?.length,
      detail:
        "A 4–8 digit code appears in this message. If it is a one-time password, it is confidential — do not forward the message or read the code to anyone.",
    };
  }

  return {
    requested: false,
    codeDetected: false,
    detail: "No OTP or verification-code request was detected in this input.",
  };
}
