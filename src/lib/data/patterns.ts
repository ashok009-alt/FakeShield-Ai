export interface ScamPatternData {
  id: string;
  name: string;
  category: string;
  riskLevel: "Medium" | "High" | "Critical";
  summary: string;
  warningSigns: string[];
  exampleMessage: string;
  goal: string;
  protection: string[];
  relatedSignals: string[];
  icon: string;
}

export const scamPatterns: ScamPatternData[] = [
  {
    id: "fake-bank-kyc",
    name: "Fake bank KYC",
    category: "Banking",
    riskLevel: "High",
    summary:
      "A message claims your KYC is incomplete and threatens to block the account unless you verify through a link or share documents.",
    warningSigns: [
      "Says your account will be blocked, frozen or closed today",
      "Links to a domain that is not your bank's official website",
      "Asks for Aadhaar, PAN, net-banking password or an OTP",
      "The sender uses a free email or an ordinary mobile number",
    ],
    exampleMessage:
      "Dear SBI customer, your KYC is pending and your account will be blocked today. Complete verification at sbi-kyc-verify.xyz and share the OTP to confirm.",
    goal: "Take over your bank account or harvest identity documents that can be used for loans and new accounts.",
    protection: [
      "Do KYC only inside your bank's official app or at a branch.",
      "Never open a KYC link sent by SMS, WhatsApp or email.",
      "Your bank will never ask for an OTP to 'complete KYC'.",
      "Call the number printed on your card or passbook to verify.",
    ],
    relatedSignals: ["kyc_request", "otp_request", "fake_kyc_pattern", "account_threat"],
    icon: "landmark",
  },
  {
    id: "otp-fraud",
    name: "OTP fraud",
    category: "Credentials",
    riskLevel: "Critical",
    summary:
      "Someone poses as a bank official, delivery agent or support agent and asks you to read out or forward a one-time password.",
    warningSigns: [
      "Asks for the OTP, 'verification code' or '6-digit code'",
      "Creates urgency: 'the transaction will fail', 'act within 2 minutes'",
      "Claims to be from your bank, a wallet, or customer care",
      "Asks you to install an app or share your screen",
    ],
    exampleMessage:
      "Sir, I am from the bank. There is a suspicious transaction on your card. To stop it, please tell me the OTP you just received. Do not hang up.",
    goal: "Complete a transaction or reset your account credentials using the code that only you receive.",
    protection: [
      "Never share an OTP with anyone — including callers who say they are from your bank.",
      "If you already shared one, call your bank immediately and block the card.",
      "Do not approve a UPI collect request you did not create.",
      "Report immediately on cybercrime.gov.in or 1930 (India).",
    ],
    relatedSignals: ["otp_request", "credential_request", "secrecy_request", "call_request"],
    icon: "key-round",
  },
  {
    id: "upi-collect-request",
    name: "UPI collect-request scam",
    category: "Payments",
    riskLevel: "High",
    summary:
      "The scammer sends a collect request or QR code and claims you will receive money, but approving it actually sends money from your account.",
    warningSigns: [
      "Says scanning or approving will 'receive' money",
      "Mentions that a debit will appear but will be reversed",
      "Comes from a buyer or seller you met online",
      "Rushes you to approve before the offer expires",
    ],
    exampleMessage:
      "I have sent ₹2,500 for the sofa. Please scan this QR and approve the request. It will show as debit but returns with ₹200 extra.",
    goal: "Get you to authorise a debit while believing you are receiving a payment.",
    protection: [
      "Approving a UPI collect request always sends money, never receives it.",
      "Receiving money requires no QR scan, PIN or approval.",
      "Check the payee name on screen before approving anything.",
      "Never enter your UPI PIN to receive a payment.",
    ],
    relatedSignals: ["upi_payment", "qr_request", "payment_request"],
    icon: "smartphone",
  },
  {
    id: "fake-delivery-fee",
    name: "Fake delivery fee",
    category: "Delivery",
    riskLevel: "High",
    summary:
      "A courier-themed message says a parcel is stuck and needs a small redelivery or customs fee paid through a link.",
    warningSigns: [
      "A very small fee is requested for a parcel you may not be expecting",
      "The link is a shortened URL or an unfamiliar domain",
      "Threatens to return the parcel within hours",
      "Uses courier branding but no order number you recognise",
    ],
    exampleMessage:
      "Your parcel is held at our facility. Pay ₹49 redelivery fee within 24 hours: amaz0n-delivery-fee.top/pay or the parcel will be returned.",
    goal: "Steal card or UPI details through a fake payment page; the fee is only bait.",
    protection: [
      "Track shipments only inside the courier's official app.",
      "Never pay a delivery fee through a link in a message.",
      "Check your order history before believing a delivery claim.",
      "Delete and report the message.",
    ],
    relatedSignals: ["delivery_fee_pattern", "delivery_reference", "link_click_request"],
    icon: "package",
  },
  {
    id: "fake-job-offer",
    name: "Fake job offer",
    category: "Jobs",
    riskLevel: "High",
    summary:
      "An unsolicited offer promises easy work and high pay, then asks for a registration fee, deposit or identity documents.",
    warningSigns: [
      "Recruiter contacts you on WhatsApp or Telegram, not through a company domain",
      "Very high pay for simple tasks and 'no experience needed'",
      "Asks for a registration, training or equipment fee",
      "Wants bank details or Aadhaar before any interview",
    ],
    exampleMessage:
      "Hiring now: simple work-from-home job, earn ₹3,000 per day, no experience needed. Pay ₹499 registration on UPI to activate your account. Reply YES.",
    goal: "Collect upfront fees and personal documents; later use them for loans or further fraud.",
    protection: [
      "Research the employer independently before engaging.",
      "Legitimate employers never ask candidates to pay.",
      "Check that the recruiter uses the company's official domain.",
      "Do not share bank details until you have a signed offer.",
    ],
    relatedSignals: ["job_offer_pattern", "payment_request", "install_app"],
    icon: "briefcase",
  },
  {
    id: "work-from-home-task",
    name: "Work-from-home task scam",
    category: "Jobs",
    riskLevel: "High",
    summary:
      "Small paid tasks (liking videos, writing reviews) build trust, then you are asked to deposit money to unlock bigger tasks.",
    warningSigns: [
      "Paid per like, review or click — with instant small payouts",
      "Invitation to a Telegram or WhatsApp 'task group'",
      "Deposits required to reach a higher task level",
      "Withdrawal blocked until you pay 'tax' or a 'fee'",
    ],
    exampleMessage:
      "You earned ₹150 for 3 task likes. To unlock ₹500 per task, top up ₹2,000 in the group wallet. Withdraw anytime after your tasks.",
    goal: "Take deposits that cannot be withdrawn, then disappear or demand more fees.",
    protection: [
      "No genuine job requires you to deposit money.",
      "Stop as soon as a 'task' turns into an investment.",
      "Screenshot conversations and report the group.",
      "Do not borrow money to unlock 'levels'.",
    ],
    relatedSignals: ["job_offer_pattern", "investment_group_pattern", "payment_request"],
    icon: "home",
  },
  {
    id: "investment-crypto",
    name: "Investment and crypto scam",
    category: "Investment",
    riskLevel: "Critical",
    summary:
      "A mentor or group promises guaranteed high returns, shows fake profits, and blocks withdrawals unless you pay more fees.",
    warningSigns: [
      "Guaranteed daily or monthly returns",
      "Invitations to private Telegram trading groups",
      "A dashboard showing profits that you cannot withdraw",
      "Requests for withdrawal tax, gas fees or account upgrades",
    ],
    exampleMessage:
      "Our expert mentor guarantees 30% daily returns. Minimum deposit $200 in USDT. Last 5 slots in the private Telegram group — join now.",
    goal: "Collect large deposits; the 'profits' are numbers on a screen.",
    protection: [
      "No one can guarantee investment returns.",
      "Check SEBI registration for any adviser you deal with.",
      "Never invest through a group chat or a direct message.",
      "Test a small withdrawal before depositing more — but assume the platform may be fake.",
    ],
    relatedSignals: ["investment_bait", "investment_group_pattern", "secrecy_request"],
    icon: "trending-up",
  },
  {
    id: "lottery-prize",
    name: "Lottery or prize scam",
    category: "Prizes",
    riskLevel: "High",
    summary:
      "You are told you have won a prize you never entered for, then asked to pay a fee or share documents to claim it.",
    warningSigns: [
      "You did not enter any draw or contest",
      "A 'processing fee' or 'tax' is required before payout",
      "A tight deadline to claim the prize",
      "Asks for Aadhaar, PAN, bank details or a selfie",
    ],
    exampleMessage:
      "Congratulations! Your number won ₹25,00,000 in the KBC Lucky Draw. Send your Aadhaar, PAN and bank details on WhatsApp to claim before 6 PM.",
    goal: "Collect fees and identity documents; the prize does not exist.",
    protection: [
      "You cannot win a lottery you never entered.",
      "Never pay a fee to receive a prize.",
      "Do not share identity documents with unknown numbers.",
      "Report the message to the platform.",
    ],
    relatedSignals: ["prize_bait", "prize_pattern", "gift_card_request"],
    icon: "trophy",
  },
  {
    id: "fake-customer-support",
    name: "Fake customer support",
    category: "Support",
    riskLevel: "High",
    summary:
      "A search result or message gives a fake support number that asks for remote access, an OTP or payment to 'fix' a problem.",
    warningSigns: [
      "The number came from a search ad or a message, not the official app",
      "Asks you to install AnyDesk, TeamViewer or QuickSupport",
      "Wants you to share your screen during banking",
      "Asks for a 'refund fee' or gift-card payment",
    ],
    exampleMessage:
      "Microsoft support: your computer is infected with 5 viruses. Call +1 888 555 0199 and allow remote access so we can clean it.",
    goal: "Get remote control of your device or charge you for fake support.",
    protection: [
      "Use support inside the official app or website only.",
      "Never install remote-access software for an unsolicited caller.",
      "Never share your screen while a banking app is open.",
      "Hang up and call the company's official number yourself.",
    ],
    relatedSignals: ["support_scam_pattern", "remote_access", "customer_care_reference"],
    icon: "headphones",
  },
  {
    id: "govt-tax-refund",
    name: "Government tax refund",
    category: "Government",
    riskLevel: "High",
    summary:
      "A fake income-tax message says a refund is approved and asks you to verify bank details on a lookalike site.",
    warningSigns: [
      "A refund you did not apply for",
      "A link that is not incometax.gov.in",
      "Asks for bank details, card number or net-banking login",
      "A deadline that will 'cancel' the refund",
    ],
    exampleMessage:
      "Income Tax Department: refund of Rs 15,490 approved for PAN XXXXX234F. Verify bank details within 24 hours at incometax-refund-portal.com or the refund is cancelled.",
    goal: "Steal bank or card credentials through a lookalike portal.",
    protection: [
      "Check refunds only on incometax.gov.in by logging in yourself.",
      "Refunds go to the bank account already verified on the portal.",
      "Government departments do not ask for card details by SMS.",
      "Forward suspicious messages to report@cybercrime.gov.in where available.",
    ],
    relatedSignals: ["gov_reference", "refund_bait", "link_click_request"],
    icon: "file-text",
  },
  {
    id: "romance-scam",
    name: "Romance scam",
    category: "Romance",
    riskLevel: "High",
    summary:
      "A fast-moving online relationship turns into requests for money, travel tickets or crypto investments.",
    warningSigns: [
      "Declares strong feelings very quickly",
      "Always has a reason not to meet or video call",
      "A sudden emergency needing money",
      "Offers to teach you 'guaranteed' crypto trading",
    ],
    exampleMessage:
      "I feel we are soulmates. I am stuck at customs and need $800 for the clearance fee. Please send USDT — I will repay you when I land.",
    goal: "Extract money through emotional pressure, often repeatedly.",
    protection: [
      "Reverse-image-search the photos; scammers often use stolen images.",
      "Insist on a live video call early on.",
      "Never send money, gift cards or crypto to someone you have not met.",
      "Tell a friend or family member what is happening.",
    ],
    relatedSignals: ["secrecy_request", "payment_request", "investment_bait"],
    icon: "heart",
  },
  {
    id: "fake-shopping-site",
    name: "Fake online shopping website",
    category: "Shopping",
    riskLevel: "Critical",
    summary:
      "A new or lookalike store offers huge discounts, takes prepaid orders, and never ships the product.",
    warningSigns: [
      "Unbeatable prices and a countdown timer",
      "Newly registered domain or lookalike brand name",
      "Only prepaid payment accepted; no COD",
      "No physical address, GST number or return policy",
    ],
    exampleMessage:
      "MEGA SALE: iPhone 17 at 70% off today only! Pay via UPI to confirm your order. Limited stock — offer ends in 2 hours.",
    goal: "Take prepaid payments and disappear, or harvest card details.",
    protection: [
      "Check the domain and reviews independently, not on the site itself.",
      "Prefer cash-on-delivery for unfamiliar stores.",
      "Use a credit card for chargeback protection when possible.",
      "Avoid paying via UPI to unknown merchants.",
    ],
    relatedSignals: ["url_risky_tld", "link_click_request", "payment_request"],
    icon: "shopping-bag",
  },
  {
    id: "digital-arrest",
    name: "Digital arrest threat",
    category: "Government",
    riskLevel: "Critical",
    summary:
      "A caller posing as police claims a case is filed in your name and keeps you on a video call until you pay.",
    warningSigns: [
      "Uniformed 'officer' on a video call with a case number",
      "Threatens immediate arrest if you hang up",
      "Tells you not to involve family or your bank",
      "Asks for money to 'verify' or 'settle' the case",
    ],
    exampleMessage:
      "This is Inspector Sharma from Cyber Crime. A money-laundering case is filed against you. Join this video call now or a team will arrest you. Do not tell your family.",
    goal: "Extort money by keeping you afraid and isolated for hours.",
    protection: [
      "Police do not arrest people over video calls.",
      "Hang up, then verify at your local police station.",
      "Tell a family member immediately.",
      "Report on cybercrime.gov.in or 1930 (India).",
    ],
    relatedSignals: ["police_reference", "secrecy_request", "urgency_immediate"],
    icon: "shield-alert",
  },
  {
    id: "electricity-disconnection",
    name: "Electricity disconnection",
    category: "Utilities",
    riskLevel: "High",
    summary:
      "A bill message says power will be cut tonight and asks you to call a number and share an OTP.",
    warningSigns: [
      "Disconnection threatened for a small, plausible amount",
      "A mobile number to call instead of the official board number",
      "Asks for an OTP or to install a 'bill payment' app",
      "Sent from an ordinary 10-digit number, not the utility's SMS ID",
    ],
    exampleMessage:
      "Your electricity will be disconnected tonight as ₹1,240 is pending. Call customer care 7406231890 and share the OTP to avoid disconnection.",
    goal: "Use the OTP to register your number on a payment app and drain the linked account.",
    protection: [
      "Check the bill in the official utility app or portal.",
      "Do not call numbers from an SMS.",
      "Never share an OTP with a 'bill' caller.",
      "Pay only through official channels.",
    ],
    relatedSignals: ["urgency_immediate", "otp_request", "call_request"],
    icon: "zap",
  },
  {
    id: "gift-card-boss",
    name: "Gift card boss impersonation",
    category: "Payments",
    riskLevel: "High",
    summary:
      "Someone impersonating a manager or executive asks for urgent gift cards and asks you to keep it secret.",
    warningSigns: [
      "Message from a new number claiming to be your boss",
      "Urgent request outside normal process",
      "Gift-card codes requested by text or email",
      "Asks you to keep it confidential",
    ],
    exampleMessage:
      "Hi, it's your CEO. I'm in a meeting and need two ₹5,000 Amazon gift cards urgently. Send the codes here and keep this between us.",
    goal: "Redeem gift-card codes before anyone notices the fraud.",
    protection: [
      "Verify through a known internal number or in person.",
      "Businesses never buy gift cards as a legitimate expense.",
      "Never share card codes by message.",
      "Tell a colleague and report the message.",
    ],
    relatedSignals: ["gift_card_request", "secrecy_request", "urgency_immediate"],
    icon: "credit-card",
  },
];

export const patternCategories = Array.from(new Set(scamPatterns.map((pattern) => pattern.category)));
