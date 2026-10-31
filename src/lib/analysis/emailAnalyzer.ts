import { extractBrands, extractEntities, extractUrls } from "./extract";
import { collectMessageSignals } from "./messageAnalyzer";
import { buildAssessment } from "./riskScoring";
import { makeSignal } from "./signalExplanations";
import { DISCLAIMER, type AnalysisResult, type EmailLink, type EmailMeta, type Signal } from "./types";
import { getHostFromText, getRegistrableDomain, hostBrandFindings, isRiskyTld } from "./urlAnalyzer";

export interface EmailInput {
  fromName?: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  body: string;
}

const FREE_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "rediffmail.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "icloud.com",
  "mail.com",
  "zoho.com",
]);

const OFFICIAL_ORG_PATTERN =
  /\b(bank|banking|gov(ernment)?|income tax|tax department|police|cyber cell|customer care|support team|security team|kyc|paypal|amazon|microsoft|google|apple|netflix|paytm|phonepe|sbi|hdfc|icici|axis|kotak|pnb|uidai|epfo|irctc)\b/i;

const GENERIC_GREETING_PATTERN = /\b(dear (customer|user|member|client|sir\/madam)|dear valued customer)\b/i;
const VERIFY_IDENTITY_PATTERN =
  /\b(verify|confirm|validate)\s+(your\s+)?(identity|account|information|details)\b|\bidentity verification\b/i;
const RESET_PASSWORD_PATTERN =
  /\b(reset (your )?password|password (has )?expired|update your password|change your password)\b/i;
const UPDATE_PAYMENT_PATTERN =
  /\b(update|verify|confirm)\s+(your\s+)?(payment|billing|card)\s+(details|information|method)\b/i;
const ATTACHMENT_PATTERN =
  /\b(attached|attachment|invoice|document|receipt)\b[^.]{0,60}\b(open|review|action required|enable (macros|editing)|download|sign)\b|\b(enable macros|enable editing)\b/i;
const SECURITY_ALERT_PATTERN =
  /\b(security alert|unusual (sign-?in|activity)|your account (has been|was) (limited|locked|compromised|suspended)|unauthori[sz]ed access|suspicious sign-?in)\b/i;
const SUBJECT_URGENCY_PATTERN =
  /\b(urgent|immediate(action)?|action required|final notice|suspended|verify now|within 24 hours|last warning)\b/i;

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at === -1 ? "" : address.slice(at + 1).trim().toLowerCase();
}

function linkIsMismatched(displayText: string | null, href: string): boolean {
  if (!displayText) return false;

  const displayHost = getHostFromText(displayText);
  const hrefHost = getHostFromText(href);
  if (displayHost && hrefHost) {
    return getRegistrableDomain(displayHost) !== getRegistrableDomain(hrefHost);
  }

  const brands = extractBrands(displayText);
  if (brands.length > 0 && hrefHost) {
    return !brands.some((brand) => hrefHost.includes(brand.toLowerCase().replace(/\s+/g, "")));
  }

  return false;
}

function parseLinks(body: string): EmailLink[] {
  const links: EmailLink[] = [];
  const seen = new Set<string>();

  const anchorPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of body.matchAll(anchorPattern)) {
    const href = match[1].trim();
    const displayText = stripHtml(match[2]).trim();
    const key = `${displayText}|${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      displayText: displayText || null,
      href,
      mismatched: linkIsMismatched(displayText || null, href),
    });
  }

  const markdownPattern = /\[([^\]]{1,120})\]\((https?:\/\/[^)\s]+)\)/gi;
  for (const match of body.matchAll(markdownPattern)) {
    const key = `${match[1]}|${match[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({
      displayText: match[1].trim(),
      href: match[2].trim(),
      mismatched: linkIsMismatched(match[1].trim(), match[2].trim()),
    });
  }

  for (const url of extractUrls(body)) {
    if (seen.has(`|${url}`)) continue;
    const alreadyCovered = links.some((link) => link.href === url);
    if (alreadyCovered) continue;
    seen.add(`|${url}`);
    links.push({ displayText: null, href: url, mismatched: false });
  }

  return links.slice(0, 12);
}

export function analyzeEmail(input: EmailInput): AnalysisResult {
  const fromName = (input.fromName ?? "").trim();
  const fromEmail = input.fromEmail.trim().toLowerCase();
  const replyTo = input.replyTo?.trim() || null;
  const subject = input.subject.trim();
  const body = input.body;
  const plainBody = stripHtml(body);
  const combined = `${subject}\n\n${plainBody}`;
  const senderDomain = emailDomain(fromEmail);
  const senderRegistrable = getRegistrableDomain(senderDomain);
  const links = parseLinks(body);

  const signals: Signal[] = [...collectMessageSignals(combined)];

  const add = (id: string, evidence?: string) => {
    const signal = makeSignal(id, evidence);
    if (signal && !signals.some((existing) => existing.id === id)) signals.push(signal);
  };

  const displayBrands = extractBrands(`${fromName} ${subject}`);
  const senderBrandFindings = hostBrandFindings(senderDomain);

  if (FREE_PROVIDERS.has(senderRegistrable)) {
    if (displayBrands.length > 0 || OFFICIAL_ORG_PATTERN.test(fromName)) {
      add(
        "sender_free_domain",
        `${fromEmail} — free mailbox used with an official-sounding name`
      );
    }
  }

  if (displayBrands.length > 0 && senderDomain) {
    const brandExplained = displayBrands.some((brand) =>
      senderDomain.includes(brand.toLowerCase().replace(/\s+/g, ""))
    );
    if (!brandExplained && !senderBrandFindings.lookalike) {
      add(
        "sender_domain_mismatch",
        `"${fromName || fromEmail}" sends from ${senderDomain}`
      );
    }
  }

  if (senderBrandFindings.lookalike) {
    add("sender_lookalike_domain", senderDomain);
  }

  if (isRiskyTld(senderDomain.split(".").pop() ?? "")) {
    add("sender_suspicious_tld", senderDomain);
  }

  if (replyTo) {
    const replyDomain = emailDomain(replyTo);
    if (replyDomain && replyDomain !== senderDomain) {
      add("reply_to_mismatch", `${fromEmail} → reply-to ${replyTo}`);
    }
  }

  if (GENERIC_GREETING_PATTERN.test(plainBody)) add("generic_greeting");

  if (VERIFY_IDENTITY_PATTERN.test(plainBody)) {
    add("verify_identity", "Requests identity or account verification");
  }

  if (RESET_PASSWORD_PATTERN.test(plainBody)) {
    add("reset_password", "Pushes a password reset");
  }

  if (UPDATE_PAYMENT_PATTERN.test(plainBody)) {
    add("update_payment", "Asks to update payment details");
  }

  if (ATTACHMENT_PATTERN.test(plainBody)) {
    add("attachment_pressure", "Pushes you to open an attachment");
  }

  if (SECURITY_ALERT_PATTERN.test(combined)) {
    add("email_security_alert", "Claims a security problem with the account");
  }

  if (SUBJECT_URGENCY_PATTERN.test(subject)) {
    add("subject_urgency", subject);
  }

  if (displayBrands.length > 0 && subject) {
    const brandInSubject = displayBrands.some((brand) =>
      subject.toLowerCase().includes(brand.toLowerCase())
    );
    if (brandInSubject) add("spoofed_brand_subject", subject);
  }

  const mismatchedLink = links.find((link) => link.mismatched);
  if (mismatchedLink) {
    add(
      "link_text_mismatch",
      `${mismatchedLink.displayText ?? "link text"} → ${mismatchedLink.href}`
    );
  }

  const plainBodyForEntities = plainBody;
  const extracted = extractEntities(`${subject}\n${plainBodyForEntities}`);
  if (links.length > 0) {
    extracted.urls = [...new Set([...extracted.urls, ...links.map((link) => link.href)])].slice(0, 12);
  }

  const assessment = buildAssessment({
    inputType: "email",
    signals,
    extracted,
    textLength: combined.length,
    familyOverride:
      senderBrandFindings.lookalike || displayBrands.length > 0
        ? "an email-impersonation attempt"
        : undefined,
  });

  const emailMeta: EmailMeta = {
    fromName: fromName || fromEmail.split("@")[0],
    fromEmail,
    replyTo,
    subject: subject || "(no subject)",
    body: plainBody,
    links,
  };

  return {
    ...assessment,
    inputType: "email",
    extracted,
    disclaimer: DISCLAIMER,
    email: emailMeta,
  };
}
