export interface MessageSample {
  id: string;
  label: string;
  tag: string;
  text: string;
}

export interface EmailSample {
  id: string;
  label: string;
  tag: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  body: string;
}

export interface UrlSample {
  id: string;
  label: string;
  url: string;
  expected: "safe" | "suspicious";
}

export const messageSamples: MessageSample[] = [
  {
    id: "kyc-block",
    label: "Fake SBI KYC",
    tag: "Banking",
    text: `Dear Customer, your SBI account will be blocked today because your KYC is pending. Update your KYC immediately at http://sbi-kyc-verify.xyz/login and share the OTP sent to your mobile to complete verification. Ignoring this may permanently close your account. - SBI Customer Care`,
  },
  {
    id: "delivery-fee",
    label: "Delivery fee",
    tag: "Delivery",
    text: `Your Amazon parcel is held at our facility because the delivery fee of ₹49 is unpaid. Pay now within 24 hours to re-schedule delivery: https://amaz0n-delivery-fee.top/pay . If payment is not received the parcel will be returned.`,
  },
  {
    id: "lottery",
    label: "Lottery winner",
    tag: "Prize",
    text: `CONGRATULATIONS!!! Your mobile number has won ₹25,00,000 in the KBC Lucky Draw 2026. To claim your prize, send your Aadhaar card, PAN and bank account number to our WhatsApp +91 98765 43210. Claim before 6 PM today or the prize will expire.`,
  },
  {
    id: "tax-refund",
    label: "Income tax refund",
    tag: "Government",
    text: `Income Tax Department: A refund of Rs 15,490 has been approved for PAN XXXXX234F. To receive the amount, verify your bank details within 24 hours at https://incometax-refund-portal.com/verify. Failure to verify will cancel the refund.`,
  },
  {
    id: "job-offer",
    label: "Work-from-home job",
    tag: "Job",
    text: `Hi, I found your profile. We are hiring for a simple work-from-home job. Earn ₹3,000 per day by liking videos, no experience needed. Just pay a one-time registration fee of ₹499 on UPI to activate your account. Reply YES to start.`,
  },
  {
    id: "digital-arrest",
    label: "Digital arrest",
    tag: "Police",
    text: `This is Inspector Sharma from Mumbai Cyber Crime Cell. A parcel with illegal items was booked in your name and a money-laundering case has been filed. You must join this video call immediately for verification or a police team will arrest you. Do not tell your family or bank about this investigation.`,
  },
  {
    id: "investment-group",
    label: "Crypto group",
    tag: "Investment",
    text: `🚀 Join our exclusive crypto trading group on Telegram! Our expert mentor guarantees 30% daily returns. Minimum deposit only $200 in USDT. Members have already doubled their money this month. Last 5 slots left — click here to join: https://bit.ly/3xYzAbC`,
  },
  {
    id: "electricity",
    label: "Electricity disconnection",
    tag: "Utility",
    text: `Dear consumer, your electricity connection will be disconnected tonight as your last bill of ₹1,240 is pending. Please call our customer care 7406231890 and share the OTP to avoid disconnection. - State Power Board`,
  },
  {
    id: "fake-support",
    label: "Fake tech support",
    tag: "Support",
    text: `MICROSOFT SECURITY ALERT: Your computer has been infected with 5 viruses. Your banking passwords are at risk. Call our certified technicians immediately at +1 888 555 0199 and allow remote access so we can clean your system.`,
  },
  {
    id: "upi-request",
    label: "UPI collect request",
    tag: "Payment",
    text: `Hello, I am sending you ₹2,500 for the sofa. Please scan this QR code and approve the collect request to receive the money. It will show as a debit but the amount will come back instantly with extra ₹200 for your help.`,
  },
  {
    id: "gift-card",
    label: "Gift card demand",
    tag: "Payment",
    text: `Hi, this is your CEO. I am in a meeting and need a favour urgently. Please buy two ₹5,000 Amazon gift cards and send me the codes within 30 minutes. Keep this confidential and do not tell anyone at work.`,
  },
  {
    id: "safe-delivery",
    label: "Genuine delivery update",
    tag: "Safe example",
    text: `Hi, this is your delivery partner from Amazon. Your order #402-7781 is out for delivery today between 2 and 5 PM. If you are not home, please use the Amazon app to reschedule. Thanks!`,
  },
];

export const emailSamples: EmailSample[] = [
  {
    id: "paypal-limited",
    label: "PayPal limitation",
    tag: "Impersonation",
    fromName: "PayPal Security",
    fromEmail: "service@paypal-secure-login.xyz",
    replyTo: "paypal.helpdesk@gmail.com",
    subject: "Urgent: Your PayPal account has been limited",
    body: `Dear Customer,<br/><br/>We noticed unusual activity on your account and have limited it for your protection. To restore access you must verify your identity within 24 hours.<br/><br/><a href="https://paypal-secure-login.xyz/verify">https://www.paypal.com/verify</a><br/><br/>If you do not verify, your account will be permanently suspended and funds held for 180 days.<br/><br/>Thanks,<br/>PayPal Security Team`,
  },
  {
    id: "microsoft-password",
    label: "Microsoft password reset",
    tag: "Credentials",
    fromName: "Microsoft Account Team",
    fromEmail: "microsoft.account.alert@gmail.com",
    replyTo: "recovery@outlook-support.cc",
    subject: "Action required: reset your Microsoft password",
    body: `Dear User,<br/><br/>Your password expires today. To keep using your Microsoft account, reset your password using the link below.<br/><br/><a href="http://account-verify-microsoft.com/reset-password?email=you">Reset password</a><br/><br/>If you do not reset your password, your files will be deleted.<br/><br/>Microsoft Account Team`,
  },
  {
    id: "hdfc-kyc",
    label: "HDFC KYC notice",
    tag: "Banking",
    fromName: "HDFC Bank",
    fromEmail: "kyc@hdfcbank-kyc.com",
    subject: "Final notice: KYC update required",
    body: `Dear Valued Customer,<br/><br/>As per RBI guidelines, your HDFC account requires KYC re-verification. Please download the attached form, fill in your Aadhaar, PAN and net banking password, and return it within 24 hours.<br/><br/>Invoice_0925.pdf<br/><br/>Failure to comply will result in account suspension.<br/><br/>HDFC Bank KYC Department`,
  },
  {
    id: "invoice-legit",
    label: "Real vendor invoice",
    tag: "Low risk example",
    fromName: "Priya Nair",
    fromEmail: "priya@clearstack.in",
    subject: "Invoice #INV-204 for October design work",
    body: `Hi Rahul,<br/><br/>Attached is the invoice for October. Payment is due on the 15th as agreed in our contract. Let me know if the PO number needs to change.<br/><br/>Thanks,<br/>Priya<br/>ClearStack Studio`,
  },
  {
    id: "amazon-order",
    label: "Amazon order scam",
    tag: "Delivery",
    fromName: "Amazon",
    fromEmail: "amazon.orders.notification@mail.com",
    subject: "Your order could not be delivered — action required",
    body: `Dear Customer,<br/><br/>Your recent order could not be delivered because the address is incomplete. A redelivery fee of $2.99 is required.<br/><br/>Please update your payment information here: <a href="https://amazon-billing-update.top/redeliver">https://www.amazon.com/orders</a><br/><br/>Failure to pay within 12 hours will cancel the order.<br/><br/>Amazon Customer Service`,
  },
];

export const urlSamples: UrlSample[] = [
  { id: "paypal", label: "Official PayPal", url: "https://www.paypal.com/signin", expected: "safe" },
  { id: "google", label: "Google search", url: "https://www.google.com", expected: "safe" },
  { id: "sbi-kyc", label: "Fake SBI KYC", url: "http://sbi-kyc-verify.xyz/login?otp=1", expected: "suspicious" },
  { id: "amazon-fee", label: "Lookalike Amazon", url: "https://amaz0n-delivery-fee.top/pay", expected: "suspicious" },
  { id: "shortener", label: "Shortened link", url: "https://bit.ly/3xYzAbC", expected: "suspicious" },
  { id: "ip-login", label: "Raw IP login", url: "http://192.168.0.10/login", expected: "suspicious" },
  { id: "paypal-lookalike", label: "PayPa1 domain", url: "https://paypa1.com/secure/update", expected: "suspicious" },
  { id: "hdfc-subdomain", label: "Brand in subdomain", url: "https://hdfc.verify-account.xyz/kyc", expected: "suspicious" },
  { id: "drive", label: "Google Drive file", url: "https://drive.google.com/file/d/1x7kQ/view", expected: "safe" },
  {
    id: "microsoft-hyphen",
    label: "Hyphenated Microsoft",
    url: "https://account-verify-microsoft.com/reset-password?email=user",
    expected: "suspicious",
  },
  { id: "apk", label: "APK download", url: "https://example.com/download/invoice.apk", expected: "suspicious" },
  { id: "flipkart", label: "Official Flipkart", url: "https://www.flipkart.com/account/orders", expected: "safe" },
];

export function getMessageSample(id: string): MessageSample | undefined {
  return messageSamples.find((sample) => sample.id === id);
}

export function getEmailSample(id: string): EmailSample | undefined {
  return emailSamples.find((sample) => sample.id === id);
}

export function getUrlSample(id: string): UrlSample | undefined {
  return urlSamples.find((sample) => sample.id === id);
}
