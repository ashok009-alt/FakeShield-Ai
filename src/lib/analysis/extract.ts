import type { ExtractedEntities } from "./types";

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`)\]}]+/gi;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const INTL_PHONE_PATTERN = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?|\d{2,5}[\s.-])\d{3,5}[\s.-]?\d{3,5}\b/g;
const IN_MOBILE_PATTERN = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
const TOLL_FREE_PATTERN = /1800[\s-]?\d{3}[\s-]?\d{3,4}\b/g;
const AMOUNT_PATTERN = /(?:₹|rs\.?|inr|\$|usd|£|€)\s?\d[\d,]*(?:\.\d{1,2})?/gi;
const ATTACHMENT_PATTERN = /[\w-]+\.(?:pdf|docx?|xlsx?|pptx?|zip|rar|html?|apk|exe|scr|msi|vbs)\b/gi;

const PAYMENT_KEYWORDS = [
  "upi",
  "gpay",
  "google pay",
  "phonepe",
  "paytm",
  "paypal",
  "bank transfer",
  "net banking",
  "gift card",
  "bitcoin",
  "usdt",
  "crypto",
  "qr code",
  "scan qr",
  "wire transfer",
  "western union",
  "cashback",
  "refund",
  "payment link",
];

const URGENCY_PHRASES = [
  "immediately",
  "urgent",
  "within 24 hours",
  "within 2 hours",
  "within 48 hours",
  "act now",
  "last chance",
  "final warning",
  "account will be blocked",
  "account has been suspended",
  "expires today",
  "asap",
  "right away",
  "last warning",
  "today only",
];

const BRANDS = [
  "SBI",
  "State Bank of India",
  "HDFC",
  "ICICI",
  "Axis Bank",
  "Kotak",
  "Punjab National Bank",
  "PNB",
  "PayPal",
  "Amazon",
  "Flipkart",
  "Microsoft",
  "Google",
  "Apple",
  "Netflix",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "India Post",
  "FedEx",
  "DHL",
  "Blue Dart",
  "Income Tax Department",
  "UIDAI",
  "EPFO",
  "IRCTC",
  "PhonePe",
  "Google Pay",
  "Paytm",
];

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?]+$/g, "");
}

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  return unique(
    matches
      .map((url) => stripTrailingPunctuation(url))
      .filter((url) => url.replace(/^https?:\/\//i, "").length > 3)
  );
}

export function extractEmails(text: string): string[] {
  return unique(text.match(EMAIL_PATTERN) ?? []);
}

export function extractPhoneNumbers(text: string): string[] {
  const international = (text.match(INTL_PHONE_PATTERN) ?? []).map((value) => value.trim());
  const indian = (text.match(IN_MOBILE_PATTERN) ?? []).map((value) => value.trim());
  const tollFree = (text.match(TOLL_FREE_PATTERN) ?? []).map((value) => value.trim());

  return unique([...tollFree, ...indian, ...international])
    .filter((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    })
    .map((value) => value.replace(/\s+/g, " ").trim());
}

export function extractAmounts(text: string): string[] {
  return unique(text.match(AMOUNT_PATTERN) ?? []);
}

export function extractPaymentKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return PAYMENT_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function extractUrgencyPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return URGENCY_PHRASES.filter((phrase) => lower.includes(phrase));
}

export function extractBrands(text: string): string[] {
  const lower = text.toLowerCase();
  return BRANDS.filter((brand) => lower.includes(brand.toLowerCase()));
}

export function extractAttachments(text: string): string[] {
  const withoutUrls = text.replace(URL_PATTERN, " ");
  return unique(text.match(ATTACHMENT_PATTERN) ?? []).filter((name) =>
    withoutUrls.toLowerCase().includes(name.toLowerCase())
  );
}

export function extractEntities(text: string): ExtractedEntities {
  return {
    urls: extractUrls(text),
    phoneNumbers: extractPhoneNumbers(text),
    emails: extractEmails(text),
    paymentKeywords: extractPaymentKeywords(text).slice(0, 8),
    urgencyPhrases: extractUrgencyPhrases(text).slice(0, 8),
    amounts: extractAmounts(text).slice(0, 6),
    brands: extractBrands(text).slice(0, 8),
    attachments: extractAttachments(text).slice(0, 5),
  };
}
