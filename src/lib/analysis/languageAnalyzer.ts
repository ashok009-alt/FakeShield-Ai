import { detectLanguage, toLanguageMeta, translateForAnalysis, type GlossCategory } from "../language";
import { extractEntities } from "./extract";
import { analyzeMessage, collectMessageSignals } from "./messageAnalyzer";
import { buildAssessment } from "./riskScoring";
import { makeSignal } from "./signalExplanations";
import { DISCLAIMER, type AnalysisResult, type Signal } from "./types";

const CATEGORY_MAP: Record<
  GlossCategory,
  { related: string[]; signalId: string; family: string }
> = {
  otp: {
    related: ["otp_request", "credential_request"],
    signalId: "lang_otp_request",
    family: "a credential-phishing attempt",
  },
  kyc: {
    related: ["kyc_request", "fake_kyc_pattern", "share_details"],
    signalId: "lang_kyc_request",
    family: "a fake-KYC identity request",
  },
  urgency: {
    related: ["urgency_immediate", "account_threat", "limited_offer"],
    signalId: "lang_urgency",
    family: "a high-pressure scam",
  },
  impersonation: {
    related: ["bank_reference", "gov_reference", "police_reference", "authority_claim"],
    signalId: "lang_impersonation",
    family: "an impersonation attempt",
  },
  payment: {
    related: ["payment_request", "upi_payment", "amount_mention", "investment_bait"],
    signalId: "lang_payment",
    family: "a money-transfer scam",
  },
  prize: {
    related: ["prize_bait", "prize_pattern"],
    signalId: "lang_prize",
    family: "a prize or lottery scam",
  },
  arrest: {
    related: ["legal_threat", "police_reference", "secrecy_request"],
    signalId: "lang_arrest",
    family: "a digital-arrest extortion attempt",
  },
  link: {
    related: ["link_click_request", "link_lookalike", "link_suspicious_domain"],
    signalId: "lang_link",
    family: "a phishing link",
  },
};

export function analyzeMultilingual(text: string): AnalysisResult {
  const trimmed = text.trim();
  const detection = detectLanguage(trimmed);

  if (detection.isLatin) {
    const result = analyzeMessage(trimmed);
    if (detection.code === "en") return result;
    return {
      ...result,
      language: {
        code: detection.code,
        label: detection.label,
        script: detection.script,
        translated: trimmed,
        partial: false,
        matchedTerms: [],
        coverage: 0,
      },
    };
  }

  const gloss = translateForAnalysis(trimmed, detection);
  const signals: Signal[] = collectMessageSignals(gloss.gloss);
  const present = new Set(signals.map((signal) => signal.id));

  for (const category of gloss.categories) {
    const mapping = CATEGORY_MAP[category];
    if (mapping.related.some((id) => present.has(id))) continue;
    const signal = makeSignal(mapping.signalId, `${detection.label} phrase detected`);
    if (signal) {
      signals.push(signal);
      present.add(signal.id);
    }
  }

  if (gloss.categories.length === 0) {
    const signal = makeSignal(
      "lang_untranslated",
      `${detection.label} text with no recognised scam phrases`
    );
    if (signal) signals.push(signal);
  }

  const family =
    gloss.categories
      .map((category) => CATEGORY_MAP[category].family)
      .find((value) => value !== "a phishing link") ?? "a regional-language scam message";

  const assessment = buildAssessment({
    inputType: "message",
    signals,
    extracted: extractEntities(trimmed),
    textLength: trimmed.length,
    extraConfidence: gloss.categories.length > 0 ? 0.02 : 0,
    familyOverride: family,
  });

  let summary: string;
  if (gloss.categories.length === 0) {
    summary = `${detection.label} message detected, but the phrase dictionary did not recognise enough scam-specific wording. The score may understate the risk — do not treat it as a safety guarantee.`;
  } else if (assessment.riskScore >= 75) {
    summary = `${detection.label} message detected. It shows several strong signs of ${family}.`;
  } else if (assessment.riskScore >= 50) {
    summary = `${detection.label} message detected. It shows multiple signs of ${family} and should be treated as high risk until verified.`;
  } else if (assessment.riskScore >= 25) {
    summary = `${detection.label} message detected. Some wording is consistent with ${family}.`;
  } else {
    summary = `${detection.label} message detected. Only weak warning signs were found, but phrase-level translation can miss context. Verify any request before acting.`;
  }

  const recommendations = [...assessment.recommendations];
  const translationNote =
    "This was a phrase-level translation, not a full machine translation. Ask a fluent speaker to confirm anything important.";
  if (gloss.partial && !recommendations.includes(translationNote)) {
    recommendations.push(translationNote);
  }

  return {
    ...assessment,
    summary,
    recommendations: recommendations.slice(0, 6),
    inputType: "message",
    extracted: extractEntities(trimmed),
    disclaimer: DISCLAIMER,
    language: toLanguageMeta(detection, gloss),
  };
}
