export interface QuizQuestionData {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  order: number;
}

export const quizQuestions: QuizQuestionData[] = [
  {
    id: "q-otp",
    question:
      "Someone calls claiming to be from your bank and asks for the OTP you just received to 'stop a fraudulent transaction'. What is the safest response?",
    options: [
      "Share it quickly before the transaction goes through",
      "Never share it, hang up, and call the number on your card",
      "Share only the last four digits",
      "Send it on WhatsApp instead of saying it aloud",
    ],
    answerIndex: 1,
    explanation:
      "No bank employee will ever ask for an OTP. Hang up and call the official number printed on your card or passbook. Even partial codes should never be shared.",
    order: 1,
  },
  {
    id: "q-domain",
    question:
      "In the link https://paypal.com.secure-login.xyz/verify, which domain would actually receive your data?",
    options: ["paypal.com", "secure-login.xyz", "verify", "Both paypal.com and secure-login.xyz"],
    answerIndex: 1,
    explanation:
      "Read the domain immediately before the first single slash. Here it is secure-login.xyz. The 'paypal.com' part is only a subdomain designed to look reassuring.",
    order: 2,
  },
  {
    id: "q-upi",
    question:
      "You are selling a sofa online. The buyer says they have sent money and asks you to scan a QR code and enter your UPI PIN to 'receive' it. What should you do?",
    options: [
      "Scan it — the buyer already sent the money",
      "Enter the PIN but only for ₹1",
      "Refuse: approving a UPI request sends money, it never receives it",
      "Ask them to resend the QR code",
    ],
    answerIndex: 2,
    explanation:
      "Approving a collect request or scanning a payment QR debits your account. Receiving money requires no PIN, no QR scan and no approval. It simply arrives.",
    order: 3,
  },
  {
    id: "q-sender",
    question:
      "An email from 'Microsoft Account Team' arrives from microsoft.account.alert@gmail.com. What does the address tell you?",
    options: [
      "It is genuine because the display name says Microsoft",
      "It is suspicious: a real Microsoft alert would come from a Microsoft domain",
      "It is safe because Gmail filters scams",
      "It is genuine if the logo looks correct",
    ],
    answerIndex: 1,
    explanation:
      "Display names are easy to fake. The part after @ is what matters: a free Gmail mailbox is not how Microsoft sends account alerts.",
    order: 4,
  },
  {
    id: "q-delivery",
    question:
      "A message says your parcel is held and you must pay a ₹49 redelivery fee through a link. What is the best next step?",
    options: [
      "Pay ₹49 — it is a small amount",
      "Open the link to check the parcel details first",
      "Ignore the link and check the shipment in the courier's official app",
      "Reply with your address and card expiry date",
    ],
    answerIndex: 2,
    explanation:
      "Small fees are bait for card or UPI details. Check the shipment in the courier's official app or with the seller. Never pay a delivery fee through a link.",
    order: 5,
  },
  {
    id: "q-gift-card",
    question:
      "A message says it is from your CEO and asks you to buy ₹10,000 in Amazon gift cards urgently and keep it secret. This is most likely:",
    options: [
      "A normal internal request",
      "An impersonation scam — verify through a known internal number",
      "A tax-deductible expense",
      "Safe if the message uses the CEO's photo",
    ],
    answerIndex: 1,
    explanation:
      "Urgent gift-card requests plus secrecy are classic impersonation signals. Verify in person or through a number you already have, never through the message.",
    order: 6,
  },
  {
    id: "q-shared-otp",
    question: "You realise you shared an OTP with a caller two minutes ago. What should you do first?",
    options: [
      "Wait to see if anything happens",
      "Call your bank immediately, block the card and report the incident",
      "Delete the SMS so the attacker cannot use it",
      "Change your email password only",
    ],
    answerIndex: 1,
    explanation:
      "Speed matters. Call your bank's official number, block the card or account if needed, and report at cybercrime.gov.in or 1930. Deleting the SMS does not revoke the code.",
    order: 7,
  },
  {
    id: "q-investment",
    question: "A Telegram group promises 'guaranteed 30% daily returns' on crypto. What is the most likely explanation?",
    options: [
      "A legitimate high-yield investment",
      "An investment scam — guaranteed high returns do not exist",
      "A government-approved scheme",
      "Safe if other members post profit screenshots",
    ],
    answerIndex: 1,
    explanation:
      "No legitimate investment can guarantee daily returns. Fake dashboards and screenshots are part of the scam. Check SEBI registration and never deposit through a group chat.",
    order: 8,
  },
  {
    id: "q-arrest",
    question:
      "A person in police uniform on a video call says a case is filed in your name and you must pay to avoid arrest. What should you do?",
    options: [
      "Pay quickly to avoid arrest",
      "Stay on the call while arranging the money",
      "Hang up; police do not arrest people over video calls — verify at a local station",
      "Send your Aadhaar to prove your identity",
    ],
    answerIndex: 2,
    explanation:
      "This is the 'digital arrest' scam. Police do not conduct arrests or demand payment over video calls. Hang up, talk to someone you trust, and verify with your local police station.",
    order: 9,
  },
  {
    id: "q-verify",
    question: "Which of these is the most independent way to verify a suspicious 'account suspended' alert?",
    options: [
      "Click the link in the alert",
      "Call the support number given in the alert",
      "Open the organisation's official app or type its address yourself",
      "Reply to the email asking for confirmation",
    ],
    answerIndex: 2,
    explanation:
      "Contact details supplied by the message are controlled by the sender. Opening the official app or typing the known address yourself is independent verification.",
    order: 10,
  },
];
