import type { AnalysisResult } from "./analysis/types";
import { INPUT_TYPE_LABEL } from "./constants";
import type { AssistantLink } from "./assistant-store";

export interface AssistantReply {
  text: string;
  chips?: string[];
  links?: AssistantLink[];
}

const CYBERCRIME: AssistantLink = { label: "cybercrime.gov.in", href: "https://cybercrime.gov.in" };

const GENERAL_CHIPS = ["What should I do?", "Check a link", "Check a phone number", "Family check"];

/**
 * Deterministic answer engine. It reads the latest analysis context (if any)
 * and a fixed topic playbook — it never calls a language model and never
 * invents a verdict.
 */
export function answerQuestion(question: string, context?: AnalysisResult | null): AssistantReply {
  const text = question.trim();
  const q = text.toLowerCase();

  if (/^(hi|hello|hey|namaste|help)\b/.test(q) || q.length === 0) {
    return {
      text: "Ask me about a result, a suspicious pattern, or where to report. If you have just run a check, I can explain that result directly.",
      chips: GENERAL_CHIPS,
    };
  }

  if (/(how|what).*(score|confidence|calculated|rated|rating)/.test(q) || /\bweight/.test(q)) {
    return {
      text:
        "The score is arithmetic, not a black box: each warning sign has a fixed weight, the weights are added, compressed onto a 0–100 curve, and severity bonuses are added. Confidence is a separate 50–95% estimate of how strongly the signals support the rating. Open any result and tap “How is this scored?” to see the exact ledger.",
      chips: ["Why is my result high risk?", "What should I do?"],
      links: [{ label: "How detection works", href: "/about" }],
    };
  }

  if (/\b(report|cybercrime|1930|complaint|police|legal|authorit)/.test(q)) {
    const urgent = context && context.riskScore >= 50;
    return {
      text: urgent
        ? `If money already moved, call 1930 now and ask your bank to flag the transfer. Then file on cybercrime.gov.in. This result is ${context?.riskLevel.toLowerCase()} risk, so the result panel shows a pre-filled complaint draft you can copy or download. Keep screenshots, transaction IDs and the original message — do not delete the chat.`
        : "For financial cyber fraud, call 1930 immediately and file on cybercrime.gov.in. Keep screenshots, transaction IDs and the original message. FakeShield can prepare a complaint draft on High or Critical results, but it cannot file or track a complaint for you.",
      chips: ["What should I do?", "Was this message a scam?"],
      links: [CYBERCRIME, { label: "Helpline 1930", href: "tel:1930" }],
    };
  }

  if (/\b(otp|one.?time|verification code|pin|password)\b/.test(q)) {
    return {
      text:
        "Never share an OTP, PIN or password — no bank, delivery company or government office needs it. If you already shared one, call your bank's official number immediately, change the password from the official app, and report the loss on 1930.",
      chips: ["Check a message", "What should I do?"],
      links: [{ label: "Message analyzer", href: "/message" }],
    };
  }

  if (/\b(upi|payment|money|refund|transfer|fee|₹|rupee)\b/.test(q)) {
    return {
      text:
        "A request to “pay a small fee” or approve a UPI collect request is the most common pattern. Receiving money never requires your PIN or an OTP. Verify the request inside the official app, and never approve a collect request you did not create.",
      chips: ["Check a phone number", "Check a link"],
      links: [
        { label: "Link checker", href: "/link" },
        { label: "Phone lookup", href: "/phone" },
      ],
    };
  }

  if (/\b(link|url|website|domain)\b/.test(q)) {
    return {
      text:
        "Paste the full URL into the link checker. It parses the domain, lookalike brands, file types and declared redirects, and checks public registry age. It never opens the page or renders it in an iframe — that is deliberate.",
      chips: ["Check a link", "What is domain age?"],
      links: [{ label: "Open link checker", href: "/link" }],
    };
  }

  if (/\b(phone|number|caller|missed call)\b/.test(q)) {
    return {
      text:
        "Use the number lookup to see whether this community has reported the number. Zero reports does not prove it is safe — new scam numbers appear daily. Never call back a number from an unexpected message.",
      chips: ["Check a phone number", "Report to cybercrime"],
      links: [{ label: "Phone lookup", href: "/phone" }],
    };
  }

  if (/\b(hindi|tamil|telugu|bengali|regional|language|translate|hinglish)\b/.test(q)) {
    return {
      text:
        "The regional-language checker detects Hindi, Bengali, Tamil, Telugu and Hinglish, glosses known scam phrases into English, and runs the same engine. Translation is phrase-level, so check the coverage and treat a low score carefully.",
      chips: ["Check a message", "What should I do?"],
      links: [{ label: "Regional-language checker", href: "/language" }],
    };
  }

  if (/\b(screenshot|image|photo|ocr)\b/.test(q)) {
    return {
      text:
        "The screenshot analyzer runs OCR entirely in your browser, then sends only the extracted text for analysis. You can edit the text before checking it. Images themselves are never uploaded to the analysis API.",
      chips: ["Check a message", "Check a link"],
      links: [{ label: "Screenshot analyzer", href: "/image" }],
    };
  }

  if (/\b(forward|whatsapp|viral|chain)\b/.test(q)) {
    return {
      text:
        "The forward detector separates spread-bait from scam signals. “Forwarded many times”, “share with 10 people” and “before it gets deleted” raise the chain score; requests for money or codes raise the scam score. Both matter, for different reasons.",
      chips: ["Check a forward", "What should I do?"],
      links: [{ label: "Forward detector", href: "/forward" }],
    };
  }

  if (/\b(family|parent|grandparent|mother|father|elder)\b/.test(q)) {
    return {
      text:
        "Family protection creates a personal link with one big question and a YES / MAYBE / NO answer. The person you share it with pastes their own message; nothing you checked is embedded in the link.",
      chips: ["Create a family check", "Report to cybercrime"],
      links: [{ label: "Family protection", href: "/protect" }],
    };
  }

  if (/\b(extension|browser|chrome|popup)\b/.test(q)) {
    return {
      text:
        "The browser extension is a concept preview — not installable. It shows what a popup scan would look like and runs the real engine on sample tabs. The page lists the permissions and reviews a real release would need.",
      chips: ["Check a link", "Check a message"],
      links: [{ label: "Extension concept", href: "/extension" }],
    };
  }

  if (/\b(trend|stats|statistics|dashboard|heat)\b/.test(q)) {
    return {
      text:
        "The trend dashboard shows this week's rising scam types, category mix and state-level report heat. Its numbers are seeded and illustrative for the demo, not a live government feed.",
      chips: ["What should I do?", "Report to cybercrime"],
      links: [{ label: "Trend dashboard", href: "/trends" }],
    };
  }

  if (/\b(history|saved|previous|delete)\b/.test(q)) {
    return {
      text:
        "Every check is saved to this browser's anonymous session. Open History to filter by risk or input type, search the summaries, and delete anything you no longer want stored.",
      chips: ["What should I do?"],
      links: [{ label: "Open history", href: "/history" }],
    };
  }

  if (/(what.*(do|next)|next step|advice|help me)/.test(q)) {
    if (context) {
      const steps = context.recommendations.slice(0, 3);
      return {
        text: `For this ${context.riskLevel.toLowerCase()}-risk ${INPUT_TYPE_LABEL[context.inputType].toLowerCase()}, the highest-value steps are:\n\n${steps
          .map((step, index) => `${index + 1}. ${step}`)
          .join("\n")}`,
        chips: ["Why is my result high risk?", "Report to cybercrime"],
        links:
          context.riskScore >= 50
            ? context.id
              ? [CYBERCRIME, { label: "See full result", href: `/report/${context.id}` }]
              : [CYBERCRIME]
            : [{ label: "See full result", href: context.id ? `/report/${context.id}` : "/" }],
      };
    }
    return {
      text:
        "Start with three rules: never share an OTP, never approve a payment you did not initiate, and verify through the official app rather than the number in the message. Then run the message through the analyzer to see which patterns fired.",
      chips: ["Check a message", "Check a phone number"],
      links: [{ label: "Message analyzer", href: "/message" }],
    };
  }

  if (/\b(this|it|my result|the result|why|safe|scam|risk|explain)\b/.test(q)) {
    if (context) {
      const tops = context.signals.slice(0, 3).map((signal) => signal.label);
      const high = context.riskScore >= 50;
      return {
        text: `This ${INPUT_TYPE_LABEL[context.inputType].toLowerCase()} scored ${context.riskScore}/100 — ${context.riskLevel.toLowerCase()} risk at ${Math.round(
          context.confidence * 100
        )}% confidence.\n\n${context.summary}\n\n${
          tops.length > 0 ? `Top signs: ${tops.join("; ")}.` : "No named warning signs fired."
        }\n\n${
          high
            ? "Treat it as hostile: do not reply, pay, click or share codes. The result panel includes a complaint draft."
            : "Keep verifying anything involving money, codes or personal data — a low score is not a guarantee."
        }`,
        chips: high ? ["What should I do?", "Report to cybercrime"] : ["What should I do?", "How is the score calculated?"],
        links: context.id
          ? [{ label: "Open full result", href: `/report/${context.id}` }]
          : [{ label: "Run a new check", href: "/" }],
      };
    }
    return {
      text:
        "I don't have a result in this tab yet. Paste a message, email or link into an analyzer and I'll explain the score, the warning signs and what to do next.",
      chips: ["Check a message", "Check a link"],
      links: [{ label: "Analyze a message", href: "/message" }],
    };
  }

  return {
    text:
      "I can help with: explaining a result, OTP and UPI scams, link checks, phone lookups, regional-language messages, forwards, family checks and reporting to cybercrime. Pick a topic below or ask in your own words.",
    chips: GENERAL_CHIPS,
    links: [
      { label: "Pattern library", href: "/patterns" },
      { label: "Learn center", href: "/learn" },
    ],
  };
}
