import type { PhoneReportCategory } from "../phone";

export interface PhoneSeed {
  number: string;
  reportCount: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  categories: Partial<Record<PhoneReportCategory, number>>;
  summary: string;
  hoursAgo: number;
}

/**
 * Illustrative community dataset for the demo. Counts are seeded, not scraped
 * from a live phone-spam network; every surface that shows them says so.
 */
export const phoneIntelSeeds: PhoneSeed[] = [
  {
    number: "+917406231890",
    reportCount: 374,
    riskLevel: "Critical",
    categories: {
      "Delivery fee": 148,
      "OTP theft": 96,
      "Fake bank / KYC": 78,
      "UPI / payment fraud": 52,
    },
    summary:
      "Most reports describe a fake electricity-disconnection call. The caller asks for an OTP or a small UPI payment to stop disconnection.",
    hoursAgo: 2,
  },
  {
    number: "+919876543210",
    reportCount: 212,
    riskLevel: "Critical",
    categories: {
      "Lottery / prize": 131,
      "Other fraud": 47,
      "Investment / crypto": 34,
    },
    summary:
      "Reported for a KBC-style lottery message asking victims to send Aadhaar, PAN and bank details to claim a prize.",
    hoursAgo: 5,
  },
  {
    number: "+919000012345",
    reportCount: 128,
    riskLevel: "Critical",
    categories: {
      "Loan app harassment": 72,
      "Fake bank / KYC": 56,
    },
    summary:
      "Reports describe aggressive loan-recovery calls and fake bank KYC requests from the same number.",
    hoursAgo: 9,
  },
  {
    number: "+918885550199",
    reportCount: 96,
    riskLevel: "High",
    categories: {
      "Tech support / remote access": 61,
      "OTP theft": 35,
    },
    summary:
      "Callers claim to be Microsoft support and ask people to install remote-access software. Do not allow screen sharing.",
    hoursAgo: 14,
  },
  {
    number: "+919999999999",
    reportCount: 61,
    riskLevel: "High",
    categories: {
      "Delivery fee": 33,
      "OTP theft": 28,
    },
    summary:
      "Reported for fake courier messages requesting a redelivery fee through a link.",
    hoursAgo: 20,
  },
  {
    number: "+919123456780",
    reportCount: 43,
    riskLevel: "High",
    categories: {
      "Delivery fee": 25,
      "UPI / payment fraud": 18,
    },
    summary:
      "Reports describe a fake parcel-fee message and a UPI collect request that debits money instead of crediting it.",
    hoursAgo: 27,
  },
  {
    number: "+917012345678",
    reportCount: 17,
    riskLevel: "Medium",
    categories: {
      "Job / task scam": 17,
    },
    summary:
      "Reported for work-from-home task offers that ask for a registration deposit before any work is assigned.",
    hoursAgo: 33,
  },
  {
    number: "+911800123456",
    reportCount: 0,
    riskLevel: "Low",
    categories: {},
    summary:
      "Toll-free format with no reports in this demo dataset. No reports is not proof of safety.",
    hoursAgo: 48,
  },
];
