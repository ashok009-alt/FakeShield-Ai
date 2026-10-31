import { buildAssessment } from "./riskScoring";
import { lookupDomainIntel } from "./domainIntel";
import { makeSignal, sortSignals } from "./signalExplanations";
import { checkSafeBrowsing } from "./safeBrowsing";
import { DISCLAIMER, type AnalysisResult, type Signal, type UrlDetails } from "./types";

export class InvalidUrlError extends Error {
  constructor(message = "That does not look like a valid URL.") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

const MULTI_PART_SUFFIXES = [
  "co.in",
  "net.in",
  "org.in",
  "gov.in",
  "ac.in",
  "nic.in",
  "com.au",
  "net.au",
  "org.au",
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "co.jp",
  "co.nz",
  "com.br",
  "com.mx",
  "com.sg",
  "com.ae",
  "co.za",
];

const SHORTENERS = new Set([
  "bit.ly",
  "bit.do",
  "t.co",
  "tinyurl.com",
  "tiny.cc",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "rebrand.ly",
  "shorturl.at",
  "lnkd.in",
  "t.ly",
  "s.id",
  "mcaf.ee",
  "surl.li",
]);

const RISKY_TLDS = new Set([
  "zip",
  "mov",
  "xyz",
  "top",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "work",
  "click",
  "support",
  "live",
  "rest",
  "cam",
  "buzz",
  "sbs",
  "icu",
  "cyou",
  "monster",
  "quest",
  "fit",
  "loan",
  "men",
  "date",
  "review",
  "country",
  "stream",
  "download",
  "racing",
  "lol",
  "biz",
]);

const SUSPICIOUS_KEYWORDS = [
  "login",
  "signin",
  "sign-in",
  "verify",
  "verification",
  "secure",
  "security",
  "update",
  "account",
  "wallet",
  "refund",
  "billing",
  "payment",
  "otp",
  "kyc",
  "unlock",
  "reset",
  "confirm",
];

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "msclkid",
  "igshid",
  "mc_cid",
  "mc_eid",
];

const REDIRECT_KEYS = [
  "url",
  "redirect",
  "redirect_uri",
  "next",
  "continue",
  "target",
  "dest",
  "destination",
  "return",
  "goto",
  "r",
];

const BRANDS: { token: string; official: string[] }[] = [
  { token: "paypal", official: ["paypal.com", "paypal.me"] },
  { token: "amazon", official: ["amazon.com", "amazon.in", "amazon.co.uk", "amazon.de"] },
  { token: "flipkart", official: ["flipkart.com"] },
  { token: "microsoft", official: ["microsoft.com", "live.com", "office.com", "outlook.com"] },
  { token: "google", official: ["google.com", "google.co.in", "gmail.com", "youtube.com"] },
  { token: "apple", official: ["apple.com", "icloud.com"] },
  { token: "netflix", official: ["netflix.com"] },
  { token: "whatsapp", official: ["whatsapp.com", "wa.me"] },
  { token: "facebook", official: ["facebook.com", "fb.com"] },
  { token: "instagram", official: ["instagram.com"] },
  { token: "sbi", official: ["sbi.co.in", "onlinesbi.sbi", "sbicard.com", "sbiyono.sbi"] },
  { token: "hdfc", official: ["hdfcbank.com", "hdfc.com", "hdfcbank.net"] },
  { token: "icici", official: ["icicibank.com"] },
  { token: "axis", official: ["axisbank.com"] },
  { token: "kotak", official: ["kotak.com"] },
  { token: "pnb", official: ["pnbindia.in"] },
  { token: "paytm", official: ["paytm.com"] },
  { token: "phonepe", official: ["phonepe.com"] },
  { token: "dhl", official: ["dhl.com"] },
  { token: "fedex", official: ["fedex.com"] },
  { token: "irctc", official: ["irctc.co.in"] },
  { token: "uidai", official: ["uidai.gov.in"] },
  { token: "epfo", official: ["epfindia.gov.in"] },
  { token: "statebank", official: ["sbi.co.in", "onlinesbi.sbi"] },
  { token: "incometax", official: ["incometax.gov.in"] },
];

const FILE_EXTENSION_PATTERN = /\.(exe|apk|scr|msi|bat|cmd|vbs|js|jar|ps1)(?:$|[?#])/i;

function normalizeLookalike(value: string): string {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/[^a-z]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let last = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        last + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      last = temp;
    }
  }
  return previous[b.length];
}

export function isRiskyTld(tld: string): boolean {
  return RISKY_TLDS.has(tld.toLowerCase());
}

export function getRegistrableDomain(host: string): string {
  if (!host) return host;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.includes(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

export function getHostFromText(text: string): string | null {
  if (!text) return null;
  const match = text.trim().match(/(?:https?:\/\/)?([a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?:[/:?#]|$)/i);
  return match ? match[1].toLowerCase() : null;
}

export function hostBrandFindings(host: string): {
  lookalike: boolean;
  brandSubdomain: boolean;
  brands: string[];
} {
  const lowerHost = host.toLowerCase();
  const registrable = getRegistrableDomain(lowerHost);
  const registrableLabel = registrable.split(".")[0] ?? registrable;
  const subdomain = lowerHost.slice(0, Math.max(0, lowerHost.length - registrable.length)).replace(/\.$/, "");
  const matchedBrands: string[] = [];
  let lookalike = false;
  let brandSubdomain = false;

  for (const brand of BRANDS) {
    const isOfficial = brand.official.some(
      (domain) => lowerHost === domain || lowerHost.endsWith(`.${domain}`)
    );
    if (isOfficial) continue;

    const token = brand.token;
    const normalizedRegistrable = normalizeLookalike(registrableLabel);
    const rawRegistrable = registrableLabel.toLowerCase();

    if (
      normalizedRegistrable === token ||
      (token.length >= 4 && normalizedRegistrable.includes(token)) ||
      (token.length >= 4 && levenshtein(normalizedRegistrable, token) === 1) ||
      (token.length === 3 && normalizedRegistrable.startsWith(token) && normalizedRegistrable.length > 3)
    ) {
      lookalike = true;
      matchedBrands.push(brand.token);
      continue;
    }

    if (subdomain) {
      for (const label of subdomain.split(".")) {
        const normalizedLabel = normalizeLookalike(label);
        if (
          normalizedLabel === token ||
          (token.length >= 4 && normalizedLabel.includes(token)) ||
          (token.length >= 4 && levenshtein(normalizedLabel, token) === 1)
        ) {
          brandSubdomain = true;
          matchedBrands.push(brand.token);
          break;
        }
      }
    }
  }

  return { lookalike, brandSubdomain, brands: [...new Set(matchedBrands)] };
}

export function parseUrlDetails(input: string): UrlDetails | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const scheme = hasScheme ? trimmed.slice(0, trimmed.indexOf("://") + 1).toLowerCase() : null;
  if (hasScheme && scheme !== "http:" && scheme !== "https:") return null;

  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const isIp =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.startsWith("[") ||
    host.includes(":");
  const hasValidTld = /\.[a-z]{2,}$/i.test(host) || isIp;

  if (!hasValidTld) return null;
  if (!isIp && !/^[a-z0-9.-]+$/.test(host)) return null;

  const registrableDomain = getRegistrableDomain(host);
  const subdomain = host.endsWith(registrableDomain)
    ? host.slice(0, host.length - registrableDomain.length).replace(/\.$/, "")
    : "";
  const labels = host.split(".");
  const tld = isIp ? "" : labels[labels.length - 1] ?? "";

  const details: UrlDetails = {
    input: trimmed,
    normalized: parsed.toString(),
    protocol: (parsed.protocol as "http:" | "https:") ?? null,
    host,
    registrableDomain,
    subdomain,
    path: parsed.pathname || "/",
    query: parsed.search.replace(/^\?/, ""),
    tld,
    isIp,
    isPunycode: host.includes("xn--"),
    length: trimmed.length,
    redirectParams: [],
    redirectTargets: [],
  };

  const redirectParams: string[] = [];
  const redirectTargets: string[] = [];
  parsed.searchParams.forEach((value, key) => {
    if (REDIRECT_KEYS.includes(key.toLowerCase()) && /https?:|\/\//i.test(value)) {
      redirectParams.push(key);
      if (redirectTargets.length < 3 && !redirectTargets.includes(value)) {
        redirectTargets.push(value);
      }
    }
  });
  details.redirectParams = redirectParams;
  details.redirectTargets = redirectTargets;

  return details;
}

function collectUrlSignals(details: UrlDetails): Signal[] {
  const signals: Signal[] = [];
  const add = (id: string, evidence?: string) => {
    const signal = makeSignal(id, evidence);
    if (signal) signals.push(signal);
  };

  const lowerHost = details.host.toLowerCase();
  const lowerPath = details.path.toLowerCase();
  const registrableLabel = details.registrableDomain.split(".")[0] ?? "";
  const subdomainLabels = details.subdomain ? details.subdomain.split(".") : [];

  if (details.protocol === "http:") add("url_http", details.input);
  if (details.isIp) add("url_ip", details.host);
  if (details.isPunycode) add("url_punycode", details.host);
  if (/[^\x00-\x7F]/.test(details.host)) add("url_unicode", details.host);
  if (subdomainLabels.length >= 2) add("url_subdomains", details.subdomain);

  if (SHORTENERS.has(details.registrableDomain)) add("url_shortener", details.registrableDomain);

  if (details.length > 100) add("url_long", `${details.length} characters`);

  let trackingCount = 0;
  try {
    const params = new URL(details.normalized).searchParams;
    params.forEach((_, key) => {
      if (TRACKING_KEYS.some((tracking) => key.toLowerCase().startsWith(tracking))) {
        trackingCount += 1;
      }
    });
  } catch {
    trackingCount = 0;
  }
  if (trackingCount >= 3) add("url_tracking", `${trackingCount} tracking parameters`);

  if (FILE_EXTENSION_PATTERN.test(lowerPath)) add("url_file", details.path);

  try {
    const parsed = new URL(details.normalized);
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      add("url_port", `port ${parsed.port}`);
    }
    if (parsed.username || parsed.password) add("url_userinfo", details.normalized);
  } catch {
    /* already validated */
  }

  const isOfficialHost = BRANDS.some((brand) =>
    brand.official.some(
      (domain) => lowerHost === domain || lowerHost.endsWith(`.${domain}`)
    )
  );

  const keyword = isOfficialHost
    ? undefined
    : SUSPICIOUS_KEYWORDS.find(
        (word) => lowerHost.includes(word) || lowerPath.includes(word)
      );
  if (keyword) add("url_keywords", keyword);

  const hyphenCount = (registrableLabel.match(/-/g) ?? []).length;
  if (hyphenCount >= 3) add("url_hyphens", details.registrableDomain);

  if (RISKY_TLDS.has(details.tld)) add("url_risky_tld", `.${details.tld}`);

  if (details.redirectParams.length > 0) {
    add("url_redirect", details.redirectParams.join(", "));
  }

  const brandInPath = BRANDS.find(
    (brand) =>
      brand.token.length >= 4 &&
      lowerPath.includes(brand.token) &&
      !brand.official.some(
        (domain) => lowerHost === domain || lowerHost.endsWith(`.${domain}`)
      )
  );
  if (brandInPath) add("url_brand_path", brandInPath.token);

  const encodedCount = (details.normalized.match(/%[0-9a-f]{2}/gi) ?? []).length;
  if (encodedCount >= 4) add("url_encoded", `${encodedCount} encoded characters`);

  const findings = hostBrandFindings(details.host);
  if (findings.lookalike) add("url_lookalike", details.registrableDomain);
  if (findings.brandSubdomain) add("url_brand_subdomain", details.host);

  return signals;
}

/** Synchronous heuristic checks used when links appear inside a message or email. */
export function quickUrlSignals(url: string): Signal[] {
  const details = parseUrlDetails(url);
  if (!details) return [];
  return sortSignals(collectUrlSignals(details))
    .filter((signal) => signal.severity === "high" || signal.severity === "critical")
    .slice(0, 2);
}

export async function analyzeUrl(input: string): Promise<AnalysisResult> {
  const details = parseUrlDetails(input);
  if (!details) throw new InvalidUrlError();

  const signals = collectUrlSignals(details);
  const [safeBrowsing, domainIntel] = await Promise.all([
    checkSafeBrowsing(details.normalized),
    lookupDomainIntel(details),
  ]);

  if (safeBrowsing.status === "matched") {
    const signal = makeSignal("url_google_match", safeBrowsing.threats.join(", "));
    if (signal) signals.push(signal);
  }

  if (domainIntel.status === "ok" && domainIntel.ageDays !== undefined && domainIntel.ageDays < 90) {
    const signal = makeSignal(
      "url_new_domain",
      `${domainIntel.ageDays} day${domainIntel.ageDays === 1 ? "" : "s"} old`
    );
    if (signal) signals.push(signal);
  }

  const threatFeed = safeBrowsing.status === "clean" || safeBrowsing.status === "matched"
    ? "verified"
    : "heuristic";

  const assessment = buildAssessment({
    inputType: "url",
    signals,
    extracted: {
      urls: [details.normalized],
      phoneNumbers: [],
      emails: [],
      paymentKeywords: [],
      urgencyPhrases: [],
      amounts: [],
      brands: hostBrandFindings(details.host).brands,
      attachments: [],
    },
    textLength: details.normalized.length,
    threatFeed,
    extraConfidence:
      safeBrowsing.status === "matched" ? 0.25 : safeBrowsing.status === "clean" ? 0.12 : 0,
    familyOverride: "a phishing or malware-hosting link",
  });

  let summary = assessment.summary;
  if (safeBrowsing.status === "matched") {
    summary =
      "Google Safe Browsing has flagged this link for phishing, malware or unwanted software. Do not open it.";
  } else if (safeBrowsing.status === "clean" && assessment.riskScore < 40) {
    summary =
      "No major warning signs were found and Google Safe Browsing has no record of this link. That is not a guarantee of safety.";
  } else if (safeBrowsing.status === "clean" && assessment.riskScore >= 40) {
    summary = `${assessment.summary} Google Safe Browsing has no record of it, so the warning comes from URL heuristics.`;
  }

  return {
    ...assessment,
    summary,
    inputType: "url",
    extracted: {
      urls: [details.normalized],
      phoneNumbers: [],
      emails: [],
      paymentKeywords: [],
      urgencyPhrases: [],
      amounts: [],
      brands: hostBrandFindings(details.host).brands,
      attachments: [],
    },
    disclaimer: DISCLAIMER,
    url: details,
    safeBrowsing,
    domainIntel,
  };
}
