import { PrismaClient } from "@prisma/client";
import { makeSignal } from "../src/lib/analysis/signalExplanations";
import type { InputType, RiskLevel, Signal } from "../src/lib/analysis/types";
import { scamPatterns } from "../src/lib/data/patterns";
import { quizQuestions } from "../src/lib/data/quiz";
import { phoneIntelSeeds } from "../src/lib/data/phone-intel";

const prisma = new PrismaClient();

interface CommunitySeed {
  inputType: InputType;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  signalIds: string[];
  minutesAgo: number;
}

const COMMUNITY_SEEDS: CommunitySeed[] = [
  { inputType: "message", riskLevel: "Critical", riskScore: 94, confidence: 0.88, signalIds: ["otp_request", "fake_kyc_pattern", "urgency_immediate"], minutesAgo: 2 },
  { inputType: "message", riskLevel: "Critical", riskScore: 91, confidence: 0.87, signalIds: ["legal_threat", "secrecy_request", "police_reference"], minutesAgo: 6 },
  { inputType: "url", riskLevel: "Critical", riskScore: 89, confidence: 0.83, signalIds: ["url_lookalike", "url_keywords", "url_risky_tld"], minutesAgo: 9 },
  { inputType: "email", riskLevel: "High", riskScore: 72, confidence: 0.82, signalIds: ["sender_domain_mismatch", "reset_password", "email_security_alert"], minutesAgo: 14 },
  { inputType: "message", riskLevel: "High", riskScore: 68, confidence: 0.79, signalIds: ["delivery_fee_pattern", "link_suspicious_domain", "urgency_immediate"], minutesAgo: 18 },
  { inputType: "message", riskLevel: "Critical", riskScore: 86, confidence: 0.84, signalIds: ["investment_bait", "investment_group_pattern", "payment_request"], minutesAgo: 23 },
  { inputType: "message", riskLevel: "Medium", riskScore: 41, confidence: 0.66, signalIds: ["forwarded_many", "viral_panic", "unverified_forward"], minutesAgo: 29 },
  { inputType: "email", riskLevel: "High", riskScore: 61, confidence: 0.77, signalIds: ["generic_greeting", "verify_identity", "link_text_mismatch"], minutesAgo: 35 },
  { inputType: "message", riskLevel: "Critical", riskScore: 97, confidence: 0.9, signalIds: ["remote_access", "support_scam_pattern", "bank_reference"], minutesAgo: 41 },
  { inputType: "message", riskLevel: "High", riskScore: 58, confidence: 0.73, signalIds: ["prize_bait", "share_details", "call_request"], minutesAgo: 48 },
  { inputType: "url", riskLevel: "High", riskScore: 55, confidence: 0.7, signalIds: ["url_brand_subdomain", "url_keywords", "url_subdomains"], minutesAgo: 56 },
  { inputType: "message", riskLevel: "Medium", riskScore: 37, confidence: 0.64, signalIds: ["job_offer_pattern", "payment_request", "reply_request"], minutesAgo: 63 },
  { inputType: "message", riskLevel: "Critical", riskScore: 90, confidence: 0.86, signalIds: ["gift_card_request", "secrecy_request", "urgency_immediate"], minutesAgo: 71 },
  { inputType: "message", riskLevel: "Low", riskScore: 18, confidence: 0.58, signalIds: ["brand_reference", "amount_mention"], minutesAgo: 80 },
  { inputType: "url", riskLevel: "Critical", riskScore: 84, confidence: 0.81, signalIds: ["url_shortener", "url_keywords"], minutesAgo: 92 },
  { inputType: "message", riskLevel: "Medium", riskScore: 33, confidence: 0.61, signalIds: ["forward_chain_request", "chain_blessing"], minutesAgo: 104 },
  { inputType: "email", riskLevel: "Critical", riskScore: 81, confidence: 0.8, signalIds: ["sender_free_domain", "update_payment", "attachment_pressure"], minutesAgo: 118 },
  { inputType: "message", riskLevel: "High", riskScore: 64, confidence: 0.75, signalIds: ["upi_payment", "qr_request", "amount_mention"], minutesAgo: 132 },
  { inputType: "message", riskLevel: "Low", riskScore: 22, confidence: 0.57, signalIds: ["delivery_reference", "link_http"], minutesAgo: 149 },
  { inputType: "url", riskLevel: "Medium", riskScore: 44, confidence: 0.65, signalIds: ["url_new_domain", "url_tracking"], minutesAgo: 167 },
  { inputType: "message", riskLevel: "Critical", riskScore: 88, confidence: 0.85, signalIds: ["kyc_request", "share_details", "lang_urgency"], minutesAgo: 188 },
  { inputType: "message", riskLevel: "High", riskScore: 62, confidence: 0.74, signalIds: ["bank_alert_pattern", "fraud_alert", "call_request"], minutesAgo: 211 },
  { inputType: "message", riskLevel: "Medium", riskScore: 29, confidence: 0.6, signalIds: ["forwarded_many", "unverified_forward"], minutesAgo: 245 },
  { inputType: "message", riskLevel: "High", riskScore: 53, confidence: 0.69, signalIds: ["install_app", "link_click_request", "brand_reference"], minutesAgo: 287 },
];

async function main() {
  for (const [index, pattern] of scamPatterns.entries()) {
    const data = {
      name: pattern.name,
      category: pattern.category,
      riskLevel: pattern.riskLevel,
      summary: pattern.summary,
      warningSigns: JSON.stringify(pattern.warningSigns),
      exampleMessage: pattern.exampleMessage,
      goal: pattern.goal,
      protection: JSON.stringify(pattern.protection),
      relatedSignals: JSON.stringify(pattern.relatedSignals),
      icon: pattern.icon,
      sortOrder: index,
    };

    await prisma.scamPattern.upsert({
      where: { id: pattern.id },
      update: data,
      create: { id: pattern.id, ...data },
    });
  }

  for (const question of quizQuestions) {
    const data = {
      question: question.question,
      options: JSON.stringify(question.options),
      answerIndex: question.answerIndex,
      explanation: question.explanation,
      sortOrder: question.order,
    };

    await prisma.quizQuestion.upsert({
      where: { id: question.id },
      update: data,
      create: { id: question.id, ...data },
    });
  }

  for (const seed of phoneIntelSeeds) {
    const existing = await prisma.phoneIntel.findUnique({ where: { number: seed.number } });
    if (!existing) {
      await prisma.phoneIntel.create({
        data: {
          number: seed.number,
          reportCount: seed.reportCount,
          riskLevel: seed.riskLevel,
          categories: JSON.stringify(seed.categories),
          summary: seed.summary,
          lastReportedAt: new Date(Date.now() - seed.hoursAgo * 3_600_000),
        },
      });
    }
  }

  for (const [index, seed] of COMMUNITY_SEEDS.entries()) {
    const signals = seed.signalIds
      .map((id) => makeSignal(id))
      .filter((signal): signal is Signal => Boolean(signal));
    const topLabel = signals[0]?.label ?? "Structural risk check";

    await prisma.analysis.upsert({
      where: { id: `seed-community-${String(index + 1).padStart(2, "0")}` },
      update: {
        createdAt: new Date(Date.now() - seed.minutesAgo * 60_000),
      },
      create: {
        id: `seed-community-${String(index + 1).padStart(2, "0")}`,
        sessionId: "demo-community-v1",
        inputType: seed.inputType,
        rawInput: `Seeded community sample — ${topLabel.toLowerCase()}`,
        riskScore: seed.riskScore,
        riskLevel: seed.riskLevel,
        confidence: seed.confidence,
        summary: `Seeded demonstration analysis for the community feed: ${topLabel.toLowerCase()}.`,
        signals: JSON.stringify(signals),
        extracted: JSON.stringify({
          urls: [],
          phoneNumbers: [],
          emails: [],
          paymentKeywords: [],
          urgencyPhrases: [],
          amounts: [],
          brands: [],
          attachments: [],
        }),
        recommendations: JSON.stringify([]),
        threatFeed: "heuristic",
        createdAt: new Date(Date.now() - seed.minutesAgo * 60_000),
      },
    });
  }

  console.log(
    `Seeded ${scamPatterns.length} scam patterns, ${quizQuestions.length} quiz questions, ${phoneIntelSeeds.length} phone records and ${COMMUNITY_SEEDS.length} community samples.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
