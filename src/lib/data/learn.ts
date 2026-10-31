export interface LearnSection {
  heading: string;
  body: string;
  steps?: string[];
}

export interface LearnGuide {
  id: string;
  title: string;
  summary: string;
  icon: string;
  readTime: string;
  category: string;
  sections: LearnSection[];
  relatedPattern?: string;
}

export const learnGuides: LearnGuide[] = [
  {
    id: "identify-phishing",
    title: "How to identify a phishing message",
    summary:
      "Phishing works by borrowing trust. Look past the logo and check the sender, the request and the pressure.",
    icon: "fish",
    readTime: "4 min",
    category: "Basics",
    sections: [
      {
        heading: "Check who is actually writing",
        body: "Display names are free to set. Open the full address and read the domain after the @ symbol. A bank writing from a Gmail address, or a domain like 'hdfcbank-secure.xyz', is not your bank.",
        steps: [
          "Expand the sender on mobile and desktop.",
          "Compare the domain with the official website you know.",
          "Hover or long-press links to preview the real destination.",
        ],
      },
      {
        heading: "Look at what they want",
        body: "Phishing nearly always asks for one of four things: a password, an OTP, card details, or a payment. Genuine alerts tell you to open the app yourself — they do not ask you to reply with secrets.",
      },
      {
        heading: "Notice artificial pressure",
        body: "Deadlines measured in minutes, threats of account closure and 'final notices' are used to stop you checking. Real organisations accept that you may call back.",
      },
      {
        heading: "A simple three-step test",
        body: "Pause, verify the sender through an independent channel, and never act from the message itself. If all three feel inconvenient, the message is doing its job.",
      },
    ],
    relatedPattern: "fake-bank-kyc",
  },
  {
    id: "check-a-link",
    title: "How to check a link safely",
    summary:
      "You can judge most dangerous links before opening them by reading the domain from right to left.",
    icon: "link",
    readTime: "4 min",
    category: "Links",
    sections: [
      {
        heading: "Read the domain, not the beginning",
        body: "The important part of a URL is the domain just before the first single slash. In 'paypal.com.secure-login.xyz/verify', the real site is secure-login.xyz — not PayPal.",
        steps: [
          "Find the first single slash after https://.",
          "Read the two or three words immediately before it.",
          "Ignore everything before them and after the slash.",
        ],
      },
      {
        heading: "Watch for shape-shifting characters",
        body: "Digits can replace letters: paypa1, amaz0n, g00gle. Hyphenated subdomains and very long chains push the real domain out of view, especially on a phone.",
      },
      {
        heading: "Short links hide everything",
        body: "bit.ly, tinyurl and similar services hide the destination. If you must know where one leads, use a link expander on a device that is not logged in to anything important — or simply do not open it.",
      },
      {
        heading: "Prefer typing the address",
        body: "Going to the official app or typing the organisation's address yourself removes the entire risk of a disguised link.",
      },
    ],
    relatedPattern: "fake-shopping-site",
  },
  {
    id: "never-share-otp",
    title: "Why OTPs should never be shared",
    summary:
      "An OTP is a password for one action. Anyone who has it can complete that action as you.",
    icon: "key-round",
    readTime: "3 min",
    category: "Credentials",
    sections: [
      {
        heading: "What an OTP actually does",
        body: "It authorises a transaction, login or password reset. It is not a 'security check' that a bank employee can perform for you — the whole point is that only you have it.",
      },
      {
        heading: "Common scripts scammers use",
        body: "They may say they are reversing a wrong transfer, blocking a fraudulent payment, completing KYC, or delivering a parcel. All of them end with the same request: read out the code.",
        steps: [
          "Real bank staff will never ask for an OTP, PIN or CVV.",
          "Do not read a code aloud, even partially.",
          "Hang up and call the number on your card.",
        ],
      },
      {
        heading: "If you already shared one",
        body: "Call your bank's official number immediately, ask to block the card or account, and check recent transactions. Then report the incident at cybercrime.gov.in or 1930 (India). Speed matters more than embarrassment.",
      },
    ],
    relatedPattern: "otp-fraud",
  },
  {
    id: "verify-sender",
    title: "How to verify a sender",
    summary:
      "Verification means using a channel the sender did not control — usually a number or address you find yourself.",
    icon: "badge-check",
    readTime: "3 min",
    category: "Basics",
    sections: [
      {
        heading: "Never verify with the contact details provided",
        body: "If a message gives you a phone number or link to 'confirm', it is not independent. Find the organisation's number on your card, statement, or a bookmark you saved earlier.",
      },
      {
        heading: "Use the app you already have",
        body: "Open your bank, courier or marketplace app directly. If the alert is real, it will usually appear there too.",
      },
      {
        heading: "Be careful with search results",
        body: "Fake support numbers are advertised in search results. Use the official website link, or support inside the app, rather than the first ad you see.",
      },
    ],
  },
  {
    id: "clicked-a-link",
    title: "What to do after clicking a suspicious link",
    summary:
      "A click is not automatically a compromise. Act quickly, but avoid panic-driven payments.",
    icon: "mouse-pointer",
    readTime: "4 min",
    category: "Recovery",
    sections: [
      {
        heading: "Disconnect and close",
        body: "Close the page. If it asked you to download a file, delete the file. If it asked to install something, uninstall it. Do not call the link's support number.",
      },
      {
        heading: "Check what you entered",
        body: "If you only opened the page, risk is usually low. If you typed a password, change it from the official app and enable two-factor authentication. If you entered card details, block the card.",
        steps: [
          "Change the password on the affected account.",
          "Enable two-factor authentication.",
          "Check recent transactions and logins.",
          "Log out other sessions if the option exists.",
        ],
      },
      {
        heading: "Scan the device if you installed something",
        body: "Run a reputable security scan. Uninstall any 'support' or 'cleaner' app you were told to install, especially remote-access tools like AnyDesk or TeamViewer.",
      },
      {
        heading: "Report and monitor",
        body: "Report the link to the platform and to cybercrime.gov.in. Watch your accounts for a few weeks for unfamiliar activity.",
      },
    ],
  },
  {
    id: "report-fraud-india",
    title: "How to report cyber fraud in India",
    summary:
      "Reporting early can freeze money in transit. The national cybercrime portal and 1930 are the main channels.",
    icon: "siren",
    readTime: "3 min",
    category: "Recovery",
    sections: [
      {
        heading: "Money lost in the last few hours",
        body: "Call 1930 (National Cyber Crime Helpline) immediately and file a complaint at cybercrime.gov.in. Report the bank account, UPI ID or card used, the amount, and the time of transaction. Banks can sometimes hold funds if notified quickly.",
        steps: [
          "Call 1930 and note the complaint reference.",
          "Inform your bank and block the card or account if needed.",
          "File the online complaint with screenshots and transaction IDs.",
        ],
      },
      {
        heading: "Messages or calls without money lost",
        body: "Report the number or email to the platform (WhatsApp, Gmail, your carrier) and file an incident on cybercrime.gov.in. Even without a loss, reports help identify campaigns.",
      },
      {
        heading: "Keep good records",
        body: "Screenshot the original message, the sender details, the link and any transactions. Do not delete the conversation before reporting.",
      },
    ],
  },
  {
    id: "passwords-recovery",
    title: "Password and account recovery basics",
    summary:
      "A strong password plus two-factor authentication stops most account takeovers.",
    icon: "lock",
    readTime: "4 min",
    category: "Credentials",
    sections: [
      {
        heading: "Use unique passwords",
        body: "Reusing one password means one breach exposes every account. Use a password manager to create and store long, unique passwords.",
      },
      {
        heading: "Turn on two-factor authentication",
        body: "Prefer an authenticator app or passkey over SMS where possible. SMS codes can be intercepted through SIM-swap fraud.",
      },
      {
        heading: "Recovering a compromised account",
        body: "Use the official 'forgot password' flow from the app or website you type yourself. If you are locked out and email is compromised too, contact the provider's official recovery channel and check your banking separately.",
        steps: [
          "Change the password from a trusted device.",
          "Revoke active sessions and app passwords.",
          "Check recovery email and phone numbers.",
          "Inform contacts if your account is sending scam messages.",
        ],
      },
    ],
  },
  {
    id: "safe-payments",
    title: "Safe payment habits",
    summary:
      "The way you pay determines whether you can get your money back. Prepaid and peer-to-peer transfers are hard to reverse.",
    icon: "wallet",
    readTime: "3 min",
    category: "Payments",
    sections: [
      {
        heading: "Know which payments can be reversed",
        body: "Credit cards offer chargebacks for fraud and non-delivery. UPI and bank transfers to unknown people are usually immediate and final. Prefer protected methods for unfamiliar sellers.",
      },
      {
        heading: "Never approve requests you did not start",
        body: "A UPI collect request or QR code sends money when you approve it. Receiving money never needs your PIN.",
      },
      {
        heading: "Treat gift cards as cash",
        body: "Gift-card codes are untraceable and cannot be refunded. No legitimate employer, government body or support team asks for them.",
      },
      {
        heading: "Slow the transaction down",
        body: "Approve only after checking the payee name, amount and purpose. If anyone pressures you to pay quickly, that pressure is itself a warning.",
      },
    ],
    relatedPattern: "upi-collect-request",
  },
];

export const learnCategories = ["Basics", "Links", "Credentials", "Payments", "Recovery"];
