import type { Severity, Signal, SignalSpec } from "./types";

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Human-written explanations and recommendations for every rule the engine can
 * fire. Kept in one place so the API, report view and tests stay consistent.
 */
export const SIGNAL_LIBRARY: Record<string, SignalSpec> = {
  // ── Urgency & pressure ────────────────────────────────────────────────
  urgency_immediate: {
    label: "Creates artificial urgency",
    category: "urgency",
    severity: "high",
    weight: 14,
    explanation:
      "The text pushes you to act fast — within minutes or hours. Genuine organisations do not usually require an instant decision by message.",
    recommendation:
      "Slow down. Check the claim through the organisation's official app or website before doing anything.",
  },
  account_threat: {
    label: "Threatens account suspension",
    category: "urgency",
    severity: "high",
    weight: 16,
    explanation:
      "It claims your account will be blocked, suspended or frozen unless you respond. This is a common lever used to bypass careful thinking.",
    recommendation:
      "Log in to the service directly using its official app or by typing the address yourself. Never through the message.",
  },
  limited_offer: {
    label: "Uses a limited-time offer",
    category: "urgency",
    severity: "medium",
    weight: 8,
    explanation:
      "A deal or offer is framed as expiring soon. Artificial deadlines are common in both marketing and scams; they are not proof of fraud on their own.",
    recommendation:
      "Compare the offer against the official source and give yourself time before paying.",
  },

  // ── Fear / legal threats ─────────────────────────────────────────────
  legal_threat: {
    label: "Threatens legal or police action",
    category: "fear",
    severity: "high",
    weight: 16,
    explanation:
      "It mentions police, courts, FIRs or legal action. Real authorities notify people through official written channels, not through random messages that demand payment.",
    recommendation:
      "Do not pay or share details. Verify with the official department using a number you find independently.",
  },
  fraud_alert: {
    label: "Describes a fake fraud alert",
    category: "fear",
    severity: "high",
    weight: 12,
    explanation:
      "It warns about suspicious activity or a fraudulent transaction and offers a link or number to 'fix' it. Scammers use the fear of loss to make their own contact details look helpful.",
    recommendation:
      "Open your bank's app or call the number printed on your card. Ignore contact details inside the message.",
  },
  fear_language: {
    label: "Uses alarming security language",
    category: "fear",
    severity: "low",
    weight: 5,
    explanation:
      "Words like 'danger', 'warning' or 'security alert' are used to raise anxiety. On their own this is only a mild signal.",
    recommendation: "Keep reading critically and verify the sender independently.",
  },

  // ── Financial bait ───────────────────────────────────────────────────
  payment_request: {
    label: "Requests a payment or transfer",
    category: "financial",
    severity: "medium",
    weight: 9,
    explanation:
      "The message asks you to pay or transfer money. Combined with urgency or an unknown link, this is a common fraud pattern.",
    recommendation:
      "Only pay through a channel you started yourself. Never transfer money to an account shared in a message.",
  },
  refund_bait: {
    label: "Uses a refund or cashback as bait",
    category: "financial",
    severity: "medium",
    weight: 9,
    explanation:
      "A refund or cashback is offered, usually paired with a link or a request for card details. Genuine refunds arrive automatically, not through random links.",
    recommendation:
      "Check your account directly with the merchant or bank. Do not enter card or bank details to 'receive' a refund.",
  },
  prize_bait: {
    label: "Claims a prize or lottery win",
    category: "financial",
    severity: "high",
    weight: 15,
    explanation:
      "You are told you have won something you did not enter for. Real lotteries do not run through random SMS, WhatsApp or email messages.",
    recommendation:
      "Do not pay a 'processing fee' or share details to claim it. Delete the message.",
  },
  investment_bait: {
    label: "Pushes an investment or crypto opportunity",
    category: "financial",
    severity: "high",
    weight: 15,
    explanation:
      "It promises returns from investments, trading or crypto. Assured or unusually high returns are a hallmark of investment fraud.",
    recommendation:
      "Check the adviser against the official regulator and never invest through a group chat or DM.",
  },
  gift_card_request: {
    label: "Asks for gift cards",
    category: "financial",
    severity: "critical",
    weight: 21,
    explanation:
      "Gift cards are untraceable and almost never requested by genuine organisations. Requests for gift-card codes are a very strong fraud signal.",
    recommendation:
      "Do not buy or share gift-card codes with anyone. Report the message to the platform.",
  },
  upi_payment: {
    label: "Uses UPI or a QR payment request",
    category: "financial",
    severity: "high",
    weight: 16,
    explanation:
      "UPI collect requests and QR codes move money out of your account. A collect request is a request to pay, not to receive.",
    recommendation:
      "Never approve a UPI collect request you did not initiate. Remember: scanning a QR code sends money, it does not receive it.",
  },
  amount_mention: {
    label: "Mentions a specific money amount",
    category: "financial",
    severity: "low",
    weight: 4,
    explanation:
      "A precise amount is used to make the request feel concrete and official. This is a weak signal by itself.",
    recommendation: "Verify any amount against your own records before acting.",
  },

  // ── Credentials & identity ───────────────────────────────────────────
  otp_request: {
    label: "Requests an OTP or verification code",
    category: "credentials",
    severity: "critical",
    weight: 24,
    explanation:
      "Banks, wallets and apps never ask you to share an OTP over a call, SMS or chat. An OTP is the last key to your account.",
    recommendation:
      "Never share an OTP with anyone — not even someone claiming to be from your bank. If you already did, contact your bank immediately.",
  },
  credential_request: {
    label: "Asks for PIN, password or card details",
    category: "credentials",
    severity: "critical",
    weight: 21,
    explanation:
      "The message asks for a PIN, password, CVV or full card number. Legitimate services do not request these through messages.",
    recommendation:
      "Do not type or send these details. Change the password if you already shared it.",
  },
  kyc_request: {
    label: "Pushes a KYC or identity re-verification",
    category: "credentials",
    severity: "high",
    weight: 15,
    explanation:
      "KYC updates are a popular pretext to collect Aadhaar, PAN, selfies and bank details. Banks only perform KYC through official branches or their own app.",
    recommendation:
      "Visit your bank's official app or branch for KYC. Do not upload documents via a link in a message.",
  },
  share_details: {
    label: "Asks you to share personal information",
    category: "credentials",
    severity: "high",
    weight: 14,
    explanation:
      "It asks you to confirm or provide personal details. Scammers reuse these details to impersonate you or reset your accounts.",
    recommendation:
      "Do not share personal details until you have independently verified who is asking.",
  },
  remote_access: {
    label: "Asks to install remote-access software",
    category: "credentials",
    severity: "critical",
    weight: 22,
    explanation:
      "Apps such as AnyDesk or TeamViewer let someone else control your screen — including your banking app. Genuine support teams do not need this for routine help.",
    recommendation:
      "Refuse screen sharing with unsolicited callers. Hang up and contact the company through its official number.",
  },
  install_app: {
    label: "Pushes an app or APK install",
    category: "credentials",
    severity: "high",
    weight: 14,
    explanation:
      "It asks you to install an app or APK from a link. Side-loaded APKs can read messages, including OTPs.",
    recommendation:
      "Only install apps from the official app store. Never enable 'install unknown apps' for a link in a message.",
  },

  // ── Impersonation ────────────────────────────────────────────────────
  bank_reference: {
    label: "Refers to a bank or banking service",
    category: "impersonation",
    severity: "medium",
    weight: 7,
    explanation:
      "The message names a bank. Scammers often borrow bank branding to make a request look official.",
    recommendation:
      "Open your banking app directly rather than using details from the message.",
  },
  gov_reference: {
    label: "Claims a government connection",
    category: "impersonation",
    severity: "high",
    weight: 14,
    explanation:
      "It claims to be from a government department. Departments communicate through official portals and physical notices, rarely via SMS payment links.",
    recommendation:
      "Check the official portal yourself (for example incometax.gov.in) and ignore links in the message.",
  },
  police_reference: {
    label: "Mentions police or cyber-crime units",
    category: "impersonation",
    severity: "high",
    weight: 14,
    explanation:
      "Mentions of police or cyber cells are frequently used for 'digital arrest' and extortion scams.",
    recommendation:
      "Do not stay on the call or pay anything. Verify through the local police station's official number.",
  },
  delivery_reference: {
    label: "Refers to a parcel or delivery",
    category: "impersonation",
    severity: "medium",
    weight: 9,
    explanation:
      "Parcel and delivery references are used for fake 'delivery fee' and 'address confirmation' scams.",
    recommendation:
      "Track the order only in the courier's official app using your own order number.",
  },
  brand_reference: {
    label: "Names a well-known brand",
    category: "impersonation",
    severity: "medium",
    weight: 7,
    explanation:
      "A well-known brand is named, which makes the request feel familiar. Scammers often fake brand communication.",
    recommendation:
      "Reach the brand through its official website or app, not through the message.",
  },
  customer_care_reference: {
    label: "Points to customer care or a helpline",
    category: "impersonation",
    severity: "low",
    weight: 6,
    explanation:
      "Customer-care numbers in messages are sometimes fake helplines that lead to a scam. This is a weak signal by itself.",
    recommendation:
      "Use the support number from the official app or website, and check it character by character.",
  },
  authority_claim: {
    label: "Claims official authority",
    category: "impersonation",
    severity: "medium",
    weight: 8,
    explanation:
      "Phrases like 'official notice' are used to signal authority. Real notices include a reference number you can verify independently.",
    recommendation: "Ask for the reference number and verify it on the official portal.",
  },

  // ── Known scam patterns ─────────────────────────────────────────────
  fake_kyc_pattern: {
    label: "Matches a fake-KYC scam pattern",
    category: "pattern",
    severity: "high",
    weight: 13,
    explanation:
      "The combination of KYC language, urgency and a link or contact request matches the fake-KYC scam used to drain bank accounts.",
    recommendation:
      "Complete KYC only inside your bank's official app or at a branch.",
  },
  delivery_fee_pattern: {
    label: "Matches a fake delivery-fee scam",
    category: "pattern",
    severity: "high",
    weight: 14,
    explanation:
      "A small 'redelivery' or customs fee is requested for a parcel. The real goal is your card or UPI details, not the fee.",
    recommendation:
      "Never pay a delivery fee through a link. Check the shipment in the courier's official app.",
  },
  job_offer_pattern: {
    label: "Matches a fake job-offer pattern",
    category: "pattern",
    severity: "high",
    weight: 13,
    explanation:
      "Easy work, high daily pay and no experience are typical of task and job scams that later ask for a 'registration' or 'deposit' fee.",
    recommendation:
      "Research the employer independently. Genuine employers never ask candidates to pay.",
  },
  investment_group_pattern: {
    label: "Matches an investment-group pattern",
    category: "pattern",
    severity: "high",
    weight: 13,
    explanation:
      "Invitations to trading groups with guaranteed profits are a classic pattern. Early small payouts are used to build trust before a large deposit is taken.",
    recommendation:
      "Do not join or deposit money into unofficial trading groups. Check SEBI registration for advisers.",
  },
  bank_alert_pattern: {
    label: "Matches a fake bank-alert pattern",
    category: "pattern",
    severity: "medium",
    weight: 9,
    explanation:
      "It imitates a bank transaction alert. The follow-up usually asks you to call a number or open a link to 'reverse' the transaction.",
    recommendation:
      "Check your account in the bank's official app. Never call a number provided in the alert.",
  },
  prize_pattern: {
    label: "Matches a prize-claim pattern",
    category: "pattern",
    severity: "high",
    weight: 14,
    explanation:
      "'Congratulations, you won' followed by a claim link is a long-running scam. The prize is the bait for fees or personal details.",
    recommendation: "Do not claim it. Delete or report the message.",
  },
  support_scam_pattern: {
    label: "Matches a fake-support scam pattern",
    category: "pattern",
    severity: "high",
    weight: 15,
    explanation:
      "It claims your device or account is compromised and offers immediate help. That 'help' is usually remote access or a payment demand.",
    recommendation:
      "Close the message. If worried, contact the company through its official support channel.",
  },
  secrecy_request: {
    label: "Asks you to keep it secret",
    category: "pattern",
    severity: "high",
    weight: 15,
    explanation:
      "Requests for secrecy — 'don't tell your family or bank' — are designed to stop someone you trust from spotting the fraud.",
    recommendation:
      "Talk to someone you trust before acting. No legitimate organisation asks you to hide a transaction.",
  },

  // ── Viral forwards and chain messages ───────────────────────────────
  forwarded_many: {
    label: "Carries forward-chain markers",
    category: "pattern",
    severity: "medium",
    weight: 6,
    explanation:
      "The text includes a 'forwarded many times', 'Fwd:' or 'as received' marker. That means the original author is unclear — it does not prove the claim is false.",
    recommendation:
      "Look for the original source before trusting or sharing it. A label from WhatsApp is not verification.",
  },
  forward_chain_request: {
    label: "Asks you to forward or share widely",
    category: "pattern",
    severity: "high",
    weight: 11,
    explanation:
      "It asks you to forward, circulate or share the message with a number of people. Real notices do not grow their reach through your contact list.",
    recommendation:
      "Do not forward it. If the claim matters, check an official source first.",
  },
  viral_panic: {
    label: "Uses viral 'do not ignore' pressure",
    category: "urgency",
    severity: "medium",
    weight: 7,
    explanation:
      "Phrases like 'do not ignore', 'must read' or 'share before it is deleted' are designed to make a message travel fast, not to inform you.",
    recommendation:
      "Pause before sharing. Search for the same claim on an official website or a trusted news source.",
  },
  chain_blessing: {
    label: "Uses a blessing or good-luck chain",
    category: "pattern",
    severity: "medium",
    weight: 4,
    explanation:
      "A blessing, 'good morning' or 'do not break the chain' message asks you to pass it on. These chains are usually harmless, but they train people to forward without checking.",
    recommendation:
      "You can keep the sentiment without forwarding. Break the chain.",
  },
  unverified_forward: {
    label: "Cites an untraceable forwarded source",
    category: "pattern",
    severity: "medium",
    weight: 6,
    explanation:
      "The source is described only as 'as received', 'received on WhatsApp' or 'viral'. There is no named document, office or link that can be checked.",
    recommendation:
      "Ask for the original source. If there isn't one, treat the claim as unverified.",
  },

  // ── Regional-language scans ─────────────────────────────────────────
  lang_otp_request: {
    label: "Regional-language message asks for an OTP",
    category: "credentials",
    severity: "critical",
    weight: 20,
    explanation:
      "The message asks for an OTP or verification code in a regional language. No bank, wallet or company will ever ask you to share an OTP.",
    recommendation:
      "Never share the OTP. End the conversation and contact your bank through its official app.",
  },
  lang_kyc_request: {
    label: "Regional-language message pushes KYC",
    category: "credentials",
    severity: "high",
    weight: 13,
    explanation:
      "It asks you to update or re-verify KYC in a regional language. Scammers use this pretext to collect Aadhaar, PAN, selfies or bank details.",
    recommendation:
      "Complete KYC only in your bank's official app or at a branch, never through a link.",
  },
  lang_payment: {
    label: "Regional-language message requests money",
    category: "financial",
    severity: "medium",
    weight: 9,
    explanation:
      "The message asks for a payment or transfer in a regional language. The request may look personal, but the payee is not verified.",
    recommendation:
      "Do not transfer money to an account or UPI ID shared in a message.",
  },
  lang_urgency: {
    label: "Regional-language message creates urgency",
    category: "urgency",
    severity: "high",
    weight: 11,
    explanation:
      "Words meaning 'immediately', 'today' or 'last chance' are used to stop you from checking. Urgency is a pressure tactic, not proof of authority.",
    recommendation:
      "Slow down and verify the claim through an official channel you find yourself.",
  },
  lang_impersonation: {
    label: "Regional-language message imitates an authority",
    category: "impersonation",
    severity: "high",
    weight: 11,
    explanation:
      "It names a bank, government department or police unit in a regional language to borrow authority it does not have.",
    recommendation:
      "Contact the organisation through its official number or portal. Do not use contact details from the message.",
  },
  lang_prize: {
    label: "Regional-language message promises a prize",
    category: "financial",
    severity: "high",
    weight: 13,
    explanation:
      "It claims you have won a prize or lottery in a regional language. Genuine lotteries do not ask for fees or personal documents by message.",
    recommendation:
      "Do not pay a fee or share documents to claim it. Delete the message.",
  },
  lang_arrest: {
    label: "Regional-language message threatens arrest",
    category: "fear",
    severity: "high",
    weight: 14,
    explanation:
      "It threatens police action or arrest in a regional language. This is a common 'digital arrest' script used to frighten people into paying.",
    recommendation:
      "No police investigation is conducted over a messaging app. Do not pay. Talk to someone you trust and call 1930.",
  },
  lang_link: {
    label: "Regional-language message pushes a link",
    category: "request",
    severity: "medium",
    weight: 7,
    explanation:
      "It asks you to click or open a link in a regional language. The link's destination is separate from what the message claims.",
    recommendation:
      "Open the organisation's official app or type its address yourself instead.",
  },
  lang_untranslated: {
    label: "Regional-language text was only partly translated",
    category: "formatting",
    severity: "medium",
    weight: 12,
    explanation:
      "The language was detected, but the phrase dictionary did not recognise enough scam-specific wording. The score may therefore understate the risk.",
    recommendation:
      "Do not treat a low score as proof of safety. Ask someone fluent in the language to read it, or verify the organisation directly.",
  },

  // ── Requests for action ─────────────────────────────────────────────
  link_click_request: {
    label: "Pushes you to click a link",
    category: "request",
    severity: "medium",
    weight: 8,
    explanation:
      "It explicitly tells you to click a link or button. Combined with urgency or credential requests, this is a common delivery method for scams.",
    recommendation:
      "Type the organisation's address yourself instead of clicking the link.",
  },
  call_request: {
    label: "Pushes you to call a number",
    category: "request",
    severity: "high",
    weight: 12,
    explanation:
      "It asks you to call a number. Fake helplines are used to talk you through a payment or remote-access setup.",
    recommendation:
      "Find the official number independently and call that instead.",
  },
  qr_request: {
    label: "Pushes you to scan a QR code",
    category: "request",
    severity: "high",
    weight: 15,
    explanation:
      "QR codes can open payment requests or install apps. Scanning a QR code can send money from your account.",
    recommendation:
      "Do not scan unsolicited QR codes. Check the payee name before approving any UPI request.",
  },
  reply_request: {
    label: "Asks you to reply or confirm",
    category: "request",
    severity: "medium",
    weight: 7,
    explanation:
      "It asks for a reply to 'confirm' or 'verify'. Replying confirms your number is active and keeps you in the scam conversation.",
    recommendation: "Do not reply. Block and report the sender.",
  },

  // ── Formatting anomalies ────────────────────────────────────────────
  all_caps: {
    label: "Uses excessive capital letters",
    category: "formatting",
    severity: "medium",
    weight: 7,
    explanation:
      "Large amounts of capital letters are used to shout and pressure. Official organisations rarely format messages this way.",
    recommendation: "Treat shouting formatting as a reason to slow down.",
  },
  repeated_punctuation: {
    label: "Uses repeated punctuation",
    category: "formatting",
    severity: "low",
    weight: 4,
    explanation:
      "Several exclamation or question marks in a row suggest a mass-sent, high-pressure message.",
    recommendation: "Check the sender through a separate, official channel.",
  },
  odd_spacing: {
    label: "Uses unusual letter spacing",
    category: "formatting",
    severity: "low",
    weight: 5,
    explanation:
      "Spaced-out letters (for example B A N K) are sometimes used to dodge spam filters while looking eye-catching to people.",
    recommendation: "Be extra careful with the sender and any links.",
  },
  grammar_anomalies: {
    label: "Contains spelling or grammar errors",
    category: "formatting",
    severity: "low",
    weight: 5,
    explanation:
      "Misspellings and awkward phrasing are common in mass-sent scams, though they also occur in legitimate messages.",
    recommendation: "Errors alone are not proof — verify the claim independently.",
  },
  lookalike_brand: {
    label: "Uses a lookalike brand name",
    category: "formatting",
    severity: "critical",
    weight: 20,
    explanation:
      "A brand is written with swapped characters (for example 'paypa1' or 'amaz0n'). This is deliberate impersonation.",
    recommendation: "Do not interact. Reach the real brand through its official site.",
  },
  many_links: {
    label: "Contains many links",
    category: "formatting",
    severity: "medium",
    weight: 7,
    explanation:
      "Multiple links make it more likely that at least one leads somewhere unsafe.",
    recommendation: "Avoid opening any of them. Check the official site directly.",
  },

  // ── Links inside messages / emails ──────────────────────────────────
  link_shortener: {
    label: "Uses a shortened link",
    category: "link",
    severity: "high",
    weight: 14,
    explanation:
      "Link shorteners hide the real destination. Scammers use them so you cannot see where you are going.",
    recommendation: "Do not open it. The real destination is hidden until clicked.",
  },
  link_brand_subdomain: {
    label: "Puts a brand name in a subdomain",
    category: "link",
    severity: "high",
    weight: 16,
    explanation:
      "A familiar brand appears before the real domain (for example 'sbi.secure-login.xyz'). The actual domain is the part just before the path — here it is not the bank.",
    recommendation: "Read the domain from right to left. Avoid the link.",
  },
  link_lookalike: {
    label: "Link contains a lookalike brand",
    category: "link",
    severity: "critical",
    weight: 20,
    explanation:
      "The link's domain imitates a known brand with small character changes, a classic phishing technique.",
    recommendation: "Do not visit. Open the real service from your own bookmark or app.",
  },
  link_http: {
    label: "Uses an insecure http link",
    category: "link",
    severity: "low",
    weight: 5,
    explanation:
      "The link does not use HTTPS, so the connection is not encrypted. This is a weak signal but worth noting.",
    recommendation: "Prefer the official HTTPS site that you navigate to yourself.",
  },
  link_ip_host: {
    label: "Uses a raw IP address link",
    category: "link",
    severity: "critical",
    weight: 20,
    explanation:
      "Legitimate services use domain names, not bare IP addresses. IP-based links are often used by phishing kits.",
    recommendation: "Do not visit the link.",
  },
  link_suspicious_domain: {
    label: "Link uses an unusual domain",
    category: "link",
    severity: "high",
    weight: 13,
    explanation:
      "The link's domain does not match the organisation named in the message. This is one of the most reliable phishing indicators.",
    recommendation: "Go to the organisation's official site directly instead.",
  },
  link_risky_tld: {
    label: "Link uses a high-risk top-level domain",
    category: "link",
    severity: "medium",
    weight: 8,
    explanation:
      "Some cheap or free top-level domains are over-represented in phishing. This is not proof, but it raises the risk.",
    recommendation: "Be cautious and verify the organisation's real domain.",
  },
  link_keyword: {
    label: "Link uses login or verification wording",
    category: "link",
    severity: "medium",
    weight: 8,
    explanation:
      "The URL contains words like 'login', 'verify', 'secure' or 'refund'. Attackers use these to look trustworthy.",
    recommendation: "Use the organisation's official app instead of the link.",
  },
  link_file: {
    label: "Link points to an executable file",
    category: "link",
    severity: "critical",
    weight: 20,
    explanation:
      "The link ends in a file type that can install software, such as .exe, .apk or .scr. These are used to deliver malware.",
    recommendation: "Do not download or open the file.",
  },

  // ── Email-specific ──────────────────────────────────────────────────
  sender_free_domain: {
    label: "Official-sounding sender uses a free email service",
    category: "sender",
    severity: "critical",
    weight: 18,
    explanation:
      "The sender presents as a bank, company or government body but writes from a free mailbox (Gmail, Yahoo, Outlook and similar). Real organisations use their own domains.",
    recommendation:
      "Treat the email as impersonation. Contact the organisation through its official website.",
  },
  sender_domain_mismatch: {
    label: "Display name does not match the sender domain",
    category: "sender",
    severity: "critical",
    weight: 20,
    explanation:
      "The display name claims a brand but the email address is on an unrelated domain. Email display names are easy to fake.",
    recommendation: "Check the part after @, not just the name. Avoid replying.",
  },
  reply_to_mismatch: {
    label: "Reply-to address differs from the sender",
    category: "sender",
    severity: "high",
    weight: 16,
    explanation:
      "A different reply-to address is used to route your response away from the real organisation and into a scam mailbox.",
    recommendation: "Do not reply. Verify the sender through official channels.",
  },
  sender_lookalike_domain: {
    label: "Sender domain imitates a known brand",
    category: "sender",
    severity: "critical",
    weight: 22,
    explanation:
      "The email domain is a near-miss of a well-known brand, such as an extra letter or a swapped digit. This is typosquatting.",
    recommendation: "Do not click, reply or download anything from this email.",
  },
  sender_suspicious_tld: {
    label: "Sender domain uses a high-risk top-level domain",
    category: "sender",
    severity: "medium",
    weight: 8,
    explanation:
      "The domain ends in a cheap or free TLD that is frequently used for disposable phishing domains.",
    recommendation: "Verify the organisation's official domain before trusting the email.",
  },
  generic_greeting: {
    label: "Uses a generic greeting",
    category: "sender",
    severity: "low",
    weight: 5,
    explanation:
      "A generic greeting such as 'Dear Customer' suggests a mass send rather than a real relationship. Many legitimate marketing emails also do this.",
    recommendation: "Use other signals — not the greeting alone — to decide.",
  },
  verify_identity: {
    label: "Asks you to verify your identity",
    category: "sender",
    severity: "high",
    weight: 15,
    explanation:
      "Identity verification requests are a standard pretext for collecting logins, card numbers or documents.",
    recommendation:
      "Do not verify through the email. Open the service directly and check for alerts there.",
  },
  reset_password: {
    label: "Pushes a password reset",
    category: "sender",
    severity: "high",
    weight: 15,
    explanation:
      "A password reset you did not request can be an attempt to take over your account or harvest credentials.",
    recommendation:
      "Ignore the link. If concerned, reset the password from inside the official app or website.",
  },
  update_payment: {
    label: "Asks you to update payment details",
    category: "sender",
    severity: "high",
    weight: 16,
    explanation:
      "Requests to update card or billing details by email are a common way to steal payment information.",
    recommendation: "Update payment only inside the official account portal.",
  },
  attachment_pressure: {
    label: "Uses attachment pressure",
    category: "sender",
    severity: "high",
    weight: 14,
    explanation:
      "It urges you to open an attached invoice or document. Attachments can carry malware or lead to credential pages.",
    recommendation:
      "Do not open the attachment. Verify the sender first through a separate channel.",
  },
  link_text_mismatch: {
    label: "Link text hides the real destination",
    category: "link",
    severity: "high",
    weight: 16,
    explanation:
      "The visible link text shows one address while the link actually points somewhere else. This is a classic phishing trick.",
    recommendation: "Hover or long-press to preview links. Here, avoid the link entirely.",
  },
  subject_urgency: {
    label: "Subject line uses urgency",
    category: "sender",
    severity: "medium",
    weight: 8,
    explanation:
      "The subject tries to make the email feel immediately important. Urgent framing is common in phishing.",
    recommendation: "Verify the claim through the organisation's official channel.",
  },
  spoofed_brand_subject: {
    label: "Subject impersonates a brand",
    category: "sender",
    severity: "high",
    weight: 12,
    explanation:
      "A brand name in the subject is used to build trust, while the actual sender may be unrelated.",
    recommendation: "Check the sender address and domain before trusting the subject.",
  },
  email_security_alert: {
    label: "Claims a security problem with your account",
    category: "sender",
    severity: "high",
    weight: 14,
    explanation:
      "Fake security alerts create fear and offer a quick fix. This is one of the most common phishing themes.",
    recommendation: "Go to the service directly and look for real alerts there.",
  },

  // ── URL page ────────────────────────────────────────────────────────
  url_http: {
    label: "No HTTPS encryption",
    category: "domain",
    severity: "low",
    weight: 6,
    explanation:
      "The link uses plain HTTP. Data you enter on the page could be read in transit. Modern sites use HTTPS by default.",
    recommendation: "Do not enter any personal details or passwords on this page.",
  },
  url_ip: {
    label: "Uses an IP address instead of a domain",
    category: "domain",
    severity: "critical",
    weight: 20,
    explanation:
      "A bare IP address hides any organisation name and is rarely used by legitimate consumer services.",
    recommendation: "Do not visit. Close the page.",
  },
  url_punycode: {
    label: "Uses punycode-encoded characters",
    category: "domain",
    severity: "high",
    weight: 18,
    explanation:
      "Punycode (xn--) can render as a familiar-looking name while the underlying domain is different. International domains are legitimate in some cases, but this is often used to imitate brands.",
    recommendation: "Check the decoded domain carefully before trusting it.",
  },
  url_unicode: {
    label: "Contains non-ASCII characters",
    category: "domain",
    severity: "high",
    weight: 18,
    explanation:
      "Non-Latin or lookalike characters can make a domain appear to be a well-known brand when it is not.",
    recommendation: "Avoid the link unless you can verify the exact domain.",
  },
  url_subdomains: {
    label: "Uses an unusual number of subdomains",
    category: "domain",
    severity: "medium",
    weight: 10,
    explanation:
      "Long subdomain chains are used to push the real domain out of view on small screens.",
    recommendation: "Identify the actual domain just before the first single slash.",
  },
  url_lookalike: {
    label: "Domain imitates a known brand",
    category: "domain",
    severity: "critical",
    weight: 22,
    explanation:
      "The domain is very close to a real brand but not identical — an extra letter, swapped digit or similar. This is a standard phishing technique.",
    recommendation: "Do not visit. Use the official app or website.",
  },
  url_brand_subdomain: {
    label: "Brand name appears in a subdomain",
    category: "domain",
    severity: "high",
    weight: 16,
    explanation:
      "The brand appears in the subdomain while the actual domain is unrelated. For example, 'hdfc.verify-account.xyz' is not HDFC.",
    recommendation: "Do not visit. Open your bank's official app instead.",
  },
  url_shortener: {
    label: "Uses a URL shortener",
    category: "domain",
    severity: "high",
    weight: 14,
    explanation:
      "Shortened links hide their destination and can be changed after they are sent.",
    recommendation: "Do not open it until you can see the expanded destination.",
  },
  url_long: {
    label: "Unusually long URL",
    category: "domain",
    severity: "low",
    weight: 6,
    explanation:
      "Very long URLs can hide the real domain or include tracking and redirect parameters.",
    recommendation: "Look at the domain immediately after the double slash.",
  },
  url_tracking: {
    label: "Contains many tracking parameters",
    category: "domain",
    severity: "low",
    weight: 5,
    explanation:
      "Several tracking or campaign parameters are present. This is common in marketing and not proof of fraud.",
    recommendation: "You can strip the parameters if you need to visit the official site.",
  },
  url_file: {
    label: "Links to an executable or installer",
    category: "domain",
    severity: "critical",
    weight: 20,
    explanation:
      "The URL ends in a file type such as .exe, .apk or .scr that can install software. These are used to deliver malware.",
    recommendation: "Do not download or open the file.",
  },
  url_port: {
    label: "Uses a non-standard port",
    category: "domain",
    severity: "medium",
    weight: 9,
    explanation:
      "The URL uses an explicit non-standard port, which is more typical of testing tools and phishing kits than consumer services.",
    recommendation: "Avoid entering credentials on this page.",
  },
  url_userinfo: {
    label: "Hides the true host with an @ sign",
    category: "domain",
    severity: "high",
    weight: 16,
    explanation:
      "An @ symbol in a URL can make the address look like a trusted site while the browser actually visits the part after the @.",
    recommendation: "Do not visit. The visible brand is fake.",
  },
  url_keywords: {
    label: "Contains credential-related keywords",
    category: "domain",
    severity: "high",
    weight: 12,
    explanation:
      "Words like login, verify, secure or refund are used to make a fake page feel trustworthy. They are common in phishing URLs.",
    recommendation: "Use the organisation's official app or website instead.",
  },
  url_hyphens: {
    label: "Domain contains many hyphens",
    category: "domain",
    severity: "low",
    weight: 5,
    explanation:
      "Multiple hyphens make it easy to build names like 'secure-login-update'. Many legitimate domains also use hyphens, so this is a weak signal.",
    recommendation: "Read the domain carefully and verify the organisation.",
  },
  url_risky_tld: {
    label: "Uses a high-risk top-level domain",
    category: "domain",
    severity: "medium",
    weight: 9,
    explanation:
      "Some cheap or free TLDs are over-represented in phishing campaigns. This is not proof, but it raises the risk.",
    recommendation: "Be cautious; confirm the real domain before entering anything.",
  },
  url_redirect: {
    label: "Contains an open-redirect parameter",
    category: "domain",
    severity: "medium",
    weight: 9,
    explanation:
      "A parameter carries another address inside the link, which can redirect you to a different site after clicking.",
    recommendation: "Do not follow the redirect; navigate to the destination directly.",
  },
  url_brand_path: {
    label: "Brand name appears only in the path",
    category: "domain",
    severity: "medium",
    weight: 8,
    explanation:
      "A brand in the path (for example 'example.com/paypal/login') does not mean the site belongs to the brand.",
    recommendation: "Check the domain, not the folder name.",
  },
  url_encoded: {
    label: "Contains heavily encoded characters",
    category: "domain",
    severity: "medium",
    weight: 9,
    explanation:
      "Encoded characters can hide the real destination or the file being served.",
    recommendation: "Avoid the link and use the official site.",
  },
  url_new_domain: {
    label: "Domain was registered recently",
    category: "domain",
    severity: "medium",
    weight: 10,
    explanation:
      "Public registry records show this domain is new. Scam sites are often registered shortly before a campaign, though legitimate new businesses also start somewhere.",
    recommendation:
      "Treat a new domain with extra caution. Verify the organisation independently before entering anything.",
  },
  url_google_match: {
    label: "Matched Google Safe Browsing threat lists",
    category: "domain",
    severity: "critical",
    weight: 30,
    explanation:
      "Google's threat feed associated this URL with phishing, malware or unwanted software. This is a strong, externally verified signal.",
    recommendation: "Do not visit the link. Report it if you received it from someone.",
  },
};

export function makeSignal(id: string, evidence?: string): Signal | null {
  const spec = SIGNAL_LIBRARY[id];
  if (!spec) return null;
  const cleaned = evidence ? cleanEvidence(evidence) : undefined;
  return cleaned ? { id, ...spec, evidence: cleaned } : { id, ...spec };
}

function cleanEvidence(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

export function sortSignals(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    return bySeverity !== 0 ? bySeverity : b.weight - a.weight;
  });
}
