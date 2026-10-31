export type Severity = "low" | "medium" | "high" | "critical";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type InputType = "message" | "email" | "url";

export type ThreatFeedStatus = "heuristic" | "verified";

export type SignalCategory =
  | "urgency"
  | "fear"
  | "financial"
  | "credentials"
  | "impersonation"
  | "request"
  | "formatting"
  | "pattern"
  | "sender"
  | "link"
  | "domain";

export interface SignalSpec {
  label: string;
  category: SignalCategory;
  severity: Severity;
  weight: number;
  explanation: string;
  recommendation: string;
}

export interface Signal extends SignalSpec {
  id: string;
  evidence?: string;
}

export interface ExtractedEntities {
  urls: string[];
  phoneNumbers: string[];
  emails: string[];
  paymentKeywords: string[];
  urgencyPhrases: string[];
  amounts: string[];
  brands: string[];
  attachments: string[];
}

export interface EmailLink {
  displayText: string | null;
  href: string;
  mismatched: boolean;
}

export interface EmailMeta {
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  subject: string;
  body: string;
  links: EmailLink[];
}

export interface UrlDetails {
  input: string;
  normalized: string;
  protocol: "http:" | "https:" | null;
  host: string;
  registrableDomain: string;
  subdomain: string;
  path: string;
  query: string;
  tld: string;
  isIp: boolean;
  isPunycode: boolean;
  length: number;
  redirectParams: string[];
  /** Declared redirect targets from the query string. Never followed. */
  redirectTargets?: string[];
}

export interface SafeBrowsingResult {
  status: "matched" | "clean" | "not_configured" | "error";
  threats: string[];
  checkedAt?: string;
  detail?: string;
}

/** Public registry metadata. Does not contact the submitted host. */
export interface DomainIntel {
  status: "ok" | "not_found" | "unavailable" | "not_applicable";
  source: "rdap";
  checkedAt: string;
  ageDays?: number;
  registeredAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  registrar?: string;
  detail?: string;
}

export interface LanguageMeta {
  code: string;
  label: string;
  script: string;
  translated: string;
  partial: boolean;
  matchedTerms: string[];
  coverage: number;
}

/** A semantic finding produced by the optional Gemini layer. */
export interface LlmReasoningPoint {
  title: string;
  detail: string;
  quote?: string;
  severity?: Severity;
}

export interface LlmAnalysis {
  provider: "gemini";
  model: string;
  status: "ok" | "cached" | "not_configured" | "error";
  semanticScore?: number;
  confidence?: number;
  summary?: string;
  reasoning: LlmReasoningPoint[];
  tactics: string[];
  recommendations: string[];
  detectedLanguage?: string;
  detail?: string;
  latencyMs?: number;
  /** The deterministic score before blending, kept for the explainer. */
  ruleScore?: number;
}

export interface OfficialDomainCheck {
  brand: string;
  claimedAs: string;
  officialDomains: string[];
  observedDomain: string | null;
  mismatch: boolean;
  detail: string;
}

export interface OtpExposure {
  requested: boolean;
  codeDetected: boolean;
  codeLength?: number;
  detail: string;
}

export interface VirusTotalResult {
  status: "ok" | "queued" | "not_found" | "not_configured" | "error";
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  timeout?: number;
  totalEngines?: number;
  checkedAt?: string;
  permalink?: string;
  detail?: string;
}

export interface WhoisResult {
  status: "ok" | "not_found" | "unavailable" | "not_configured" | "not_applicable";
  source: "rdap" | "apilayer";
  createdDays?: number;
  created?: string;
  expires?: string;
  registrar?: string;
  detail?: string;
}

export interface IpGeoResult {
  status: "ok" | "not_found" | "not_configured" | "error";
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  org?: string;
  timezone?: string;
  detail?: string;
}

export interface CtLogResult {
  status: "ok" | "none" | "unavailable" | "error";
  firstSeen?: string;
  firstSeenDays?: number;
  certificateCount?: number;
  detail?: string;
}

export interface ShodanResult {
  status: "ok" | "not_found" | "not_configured" | "error";
  ip?: string;
  org?: string;
  ports?: number[];
  vulns?: string[];
  hostnames?: string[];
  detail?: string;
}

export interface UrlThreatIntel {
  virusTotal?: VirusTotalResult;
  whois?: WhoisResult;
  ipGeo?: IpGeoResult;
  ctLogs?: CtLogResult;
  shodan?: ShodanResult;
}

/** Optional Have I Been Pwned lookup, only run with explicit consent. */
export interface BreachResult {
  status: "ok" | "none" | "not_configured" | "error";
  checkedEmail?: string;
  breachCount?: number;
  breaches?: { name: string; title: string; breachDate?: string; dataClasses?: string[] }[];
  detail?: string;
}

export interface AnalysisResult {
  id?: string;
  inputType: InputType;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  signals: Signal[];
  extracted: ExtractedEntities;
  recommendations: string[];
  disclaimer: string;
  threatFeed: ThreatFeedStatus;
  createdAt?: string;
  email?: EmailMeta;
  url?: UrlDetails;
  safeBrowsing?: SafeBrowsingResult;
  domainIntel?: DomainIntel;
  language?: LanguageMeta;
  llm?: LlmAnalysis;
  officialDomain?: OfficialDomainCheck;
  otp?: OtpExposure;
  threatIntel?: UrlThreatIntel;
  breach?: BreachResult;
}

export const DISCLAIMER =
  "FakeShield AI provides risk guidance, not a final security verdict.";

export const RISK_THRESHOLDS: { level: RiskLevel; min: number; max: number }[] = [
  { level: "Low", min: 0, max: 24 },
  { level: "Medium", min: 25, max: 49 },
  { level: "High", min: 50, max: 74 },
  { level: "Critical", min: 75, max: 100 },
];
