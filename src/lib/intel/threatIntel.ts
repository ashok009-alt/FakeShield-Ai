import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import type {
  BreachResult,
  CtLogResult,
  DomainIntel,
  IpGeoResult,
  ShodanResult,
  UrlDetails,
  UrlThreatIntel,
  VirusTotalResult,
  WhoisResult,
} from "@/lib/analysis/types";

/**
 * Optional threat-intelligence clients. Every function:
 *  - returns an explicit `not_configured` state when its key is missing;
 *  - has a hard timeout and never throws;
 *  - caches successful responses (24h for URLs) in Redis or memory;
 *  - only ever queries the URL string, domain name or IP — FakeShield still
 *    never fetches the submitted page.
 *
 * Keys are read from the server environment only.
 */

const DAY = 24 * 60 * 60;
const VT_TIMEOUT_MS = 6000;
const GEO_TIMEOUT_MS = 5000;
const CT_TIMEOUT_MS = 7000;
const SHODAN_TIMEOUT_MS = 6000;
const HIBP_TIMEOUT_MS = 6000;

export interface ProviderStatus {
  gemini: boolean;
  virusTotal: boolean;
  ipinfoToken: boolean;
  shodan: boolean;
  hibp: boolean;
  safeBrowsing: boolean;
  upstash: boolean;
}

export function providerStatus(): ProviderStatus {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    virusTotal: Boolean(process.env.VIRUSTOTAL_API_KEY?.trim()),
    ipinfoToken: Boolean(process.env.IPINFO_TOKEN?.trim()),
    shodan: Boolean(process.env.SHODAN_API_KEY?.trim()),
    hibp: Boolean(process.env.HIBP_API_KEY?.trim()),
    safeBrowsing: Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim()),
    upstash: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    ),
  };
}

function countryName(code?: string): string | undefined {
  if (!code || code.length !== 2) return undefined;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * VirusTotal — read-only lookup of the URL by its base64url id.
 * We never submit the URL for scanning, which keeps this a pure GET.
 * ------------------------------------------------------------------ */

export async function lookupVirusTotal(url: string): Promise<VirusTotalResult> {
  const key = process.env.VIRUSTOTAL_API_KEY?.trim();
  if (!key) {
    return {
      status: "not_configured",
      detail:
        "Set VIRUSTOTAL_API_KEY to check this URL against 90+ engines. No URL is sent while the key is absent.",
    };
  }

  const id = Buffer.from(url)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const cacheId = cacheKey(["vt", "url", id]);
  const cached = await cacheGet<VirusTotalResult>(cacheId);
  if (cached) return { ...cached, detail: `${cached.detail ?? ""} (cached)`.trim() };

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { "x-apikey": key, Accept: "application/json" },
      signal: AbortSignal.timeout(VT_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status === 404) {
      return {
        status: "not_found",
        detail:
          "VirusTotal has no analysis record for this exact URL. That is not a clean bill of health — nobody may have reported it yet.",
      };
    }
    if (response.status === 401 || response.status === 403) {
      return { status: "error", detail: "VirusTotal rejected the configured API key." };
    }
    if (response.status === 429) {
      return {
        status: "error",
        detail: "VirusTotal's free-tier limit (4 requests/minute) was reached. Try again in a minute.",
      };
    }
    if (!response.ok) {
      return { status: "error", detail: `VirusTotal returned HTTP ${response.status}.` };
    }

    const body = await readJson<{
      data?: {
        attributes?: {
          last_analysis_stats?: {
            malicious?: number;
            suspicious?: number;
            harmless?: number;
            undetected?: number;
            timeout?: number;
          };
          last_analysis_date?: number;
        };
      };
    }>(response);

    const stats = body?.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return { status: "error", detail: "VirusTotal returned an unexpected response shape." };
    }

    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;
    const harmless = stats.harmless ?? 0;
    const undetected = stats.undetected ?? 0;
    const timeout = stats.timeout ?? 0;
    const totalEngines = malicious + suspicious + harmless + undetected + timeout;
    const checkedAt = new Date().toISOString();

    const result: VirusTotalResult = {
      status: "ok",
      malicious,
      suspicious,
      harmless,
      undetected,
      timeout,
      totalEngines,
      checkedAt,
      permalink: `https://www.virustotal.com/gui/url/${id}`,
      detail:
        malicious + suspicious > 0
          ? `${malicious} engine${malicious === 1 ? "" : "s"} flagged this URL as malicious and ${suspicious} as suspicious, out of ${totalEngines}.`
          : `0 of ${totalEngines} engines flagged this URL. A clean VirusTotal record is not proof that a site is genuine.`,
    };
    await cacheSet(cacheId, result, DAY);
    return result;
  } catch (error) {
    return {
      status: "error",
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "VirusTotal did not answer in time. The URL structure signals are unaffected."
          : "VirusTotal could not be reached. The URL structure signals are unaffected.",
    };
  }
}

/* ------------------------------------------------------------------ *
 * WHOIS / RDAP — the domainIntel lookup already queries the public
 * registry. This maps it into the WHOIS panel shape without a paid key.
 * ------------------------------------------------------------------ */

export function whoisFromDomainIntel(intel?: DomainIntel): WhoisResult | undefined {
  if (!intel) return undefined;
  if (intel.status === "ok") {
    return {
      status: "ok",
      source: "rdap",
      createdDays: intel.ageDays,
      created: intel.registeredAt,
      expires: intel.expiresAt,
      registrar: intel.registrar,
      detail:
        typeof intel.ageDays === "number"
          ? `The public registry shows this domain was created ${intel.ageDays.toLocaleString(
              "en-IN"
            )} days ago.`
          : "The public registry has a record, but no creation date was published.",
    };
  }
  if (intel.status === "not_found") {
    return {
      status: "not_found",
      source: "rdap",
      detail:
        "No public registration record was returned. Very new domains and some country-code registries behave this way.",
    };
  }
  if (intel.status === "not_applicable") {
    return {
      status: "not_applicable",
      source: "rdap",
      detail: "WHOIS/RDAP age checks apply to domain names, not raw IP addresses.",
    };
  }
  return {
    status: "unavailable",
    source: "rdap",
    detail: "The public registry did not answer in time. Domain age is unknown.",
  };
}

/* ------------------------------------------------------------------ *
 * ipinfo.io — hosting location for the hostname/IP. The hostname is
 * resolved by ipinfo; FakeShield does not connect to the submitted host.
 * ------------------------------------------------------------------ */

export async function lookupIpGeo(host: string): Promise<IpGeoResult> {
  const token = process.env.IPINFO_TOKEN?.trim();
  const cacheHost = cacheKey(["ipgeo", host.toLowerCase()]);
  const cached = await cacheGet<IpGeoResult>(cacheHost);
  if (cached) return cached;

  try {
    const endpoint = `https://ipinfo.io/${encodeURIComponent(host)}/json${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status === 404) {
      return { status: "not_found", detail: "ipinfo could not resolve this host." };
    }
    if (response.status === 429) {
      return {
        status: "error",
        detail: "ipinfo rate limit reached. Add IPINFO_TOKEN to lift the anonymous limit.",
      };
    }
    if (!response.ok) {
      return { status: "error", detail: `ipinfo returned HTTP ${response.status}.` };
    }

    const body = await readJson<{
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
      org?: string;
      timezone?: string;
      bogon?: boolean;
      error?: { title?: string };
    }>(response);

    if (!body || body.error) {
      return { status: "error", detail: body?.error?.title ?? "ipinfo returned an unexpected response." };
    }
    if (body.bogon) {
      return {
        status: "not_found",
        detail: "This host resolves to a private or reserved address, so there is no public hosting location.",
      };
    }

    const name = countryName(body.country);
    const place = [body.city, name].filter(Boolean).join(", ");
    const result: IpGeoResult = {
      status: "ok",
      ip: body.ip,
      country: name,
      countryCode: body.country,
      region: body.region,
      city: body.city,
      org: body.org,
      timezone: body.timezone,
      detail: `${place || "Unknown location"}${body.org ? ` · ${body.org}` : ""}. Geolocation is approximate — CDNs, VPNs and proxies can mislead.`,
    };
    await cacheSet(cacheHost, result, DAY);
    return result;
  } catch (error) {
    return {
      status: "error",
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "The IP geolocation lookup timed out."
          : "The IP geolocation service could not be reached.",
    };
  }
}

/* ------------------------------------------------------------------ *
 * Certificate Transparency (crt.sh) — first public certificate date.
 * A newly issued certificate on a newly registered domain is a strong
 * phishing signal, shown alongside the domain age.
 * ------------------------------------------------------------------ */

export async function lookupCtLogs(domain: string): Promise<CtLogResult> {
  if (!domain || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return { status: "none", detail: "Certificate Transparency lookup applies to domain names." };
  }

  const cacheId = cacheKey(["ct", domain.toLowerCase()]);
  const cached = await cacheGet<CtLogResult>(cacheId);
  if (cached) return cached;

  try {
    const query = encodeURIComponent(`%.${domain}`);
    const response = await fetch(
      `https://crt.sh/?q=${query}&output=json&exclude=expired&deduplicate=Y`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "FakeShieldAI/1.0 (hackathon demo; certificate metadata only)",
        },
        signal: AbortSignal.timeout(CT_TIMEOUT_MS),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { status: "unavailable", detail: `crt.sh returned HTTP ${response.status}.` };
    }
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > 5_000_000) {
      return {
        status: "unavailable",
        detail: "This domain has too many certificates to summarise quickly.",
      };
    }

    const entries = await readJson<{ not_before?: string; name_value?: string }[]>(response);
    if (!Array.isArray(entries)) {
      return { status: "unavailable", detail: "crt.sh returned an unexpected response." };
    }

    const times = entries
      .map((entry) => (entry.not_before ? new Date(entry.not_before).getTime() : NaN))
      .filter((time) => Number.isFinite(time))
      .slice(0, 5000);
    if (times.length === 0) {
      return {
        status: "none",
        detail:
          "No public certificate was found in Certificate Transparency logs. That is unusual for an active site, but not proof of fraud.",
      };
    }

    const earliest = Math.min(...times);
    const days = Math.max(0, Math.floor((Date.now() - earliest) / 86_400_000));
    const result: CtLogResult = {
      status: "ok",
      firstSeen: new Date(earliest).toISOString(),
      firstSeenDays: days,
      certificateCount: entries.length,
      detail: `The earliest public certificate for this domain was issued ${days.toLocaleString(
        "en-IN"
      )} day${days === 1 ? "" : "s"} ago. Certificates are free — a padlock alone proves nothing, but a very new certificate on a very new domain is a common phishing pattern.`,
    };
    await cacheSet(cacheId, result, DAY);
    return result;
  } catch (error) {
    return {
      status: "unavailable",
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "crt.sh did not answer in time."
          : "The Certificate Transparency log could not be reached.",
    };
  }
}

/* ------------------------------------------------------------------ *
 * Shodan — open ports and known CVEs on the hosting IP.
 * ------------------------------------------------------------------ */

export async function lookupShodan(ip: string): Promise<ShodanResult> {
  const key = process.env.SHODAN_API_KEY?.trim();
  if (!key) {
    return {
      status: "not_configured",
      detail: "Set SHODAN_API_KEY to look up open ports and known vulnerabilities for the hosting IP.",
    };
  }
  if (!ip) {
    return { status: "not_found", detail: "No public IP was resolved for this host." };
  }

  const cacheId = cacheKey(["shodan", ip]);
  const cached = await cacheGet<ShodanResult>(cacheId);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(SHODAN_TIMEOUT_MS), cache: "no-store" }
    );

    if (response.status === 404) {
      return {
        status: "not_found",
        ip,
        detail: "Shodan has no crawl data for this IP address.",
      };
    }
    if (response.status === 401 || response.status === 403) {
      return { status: "error", ip, detail: "Shodan rejected the configured API key." };
    }
    if (response.status === 429) {
      return { status: "error", ip, detail: "Shodan's query limit was reached. Try again later." };
    }
    if (!response.ok) {
      return { status: "error", ip, detail: `Shodan returned HTTP ${response.status}.` };
    }

    const body = await readJson<{
      ip_str?: string;
      org?: string;
      ports?: number[];
      vulns?: Record<string, unknown>;
      hostnames?: string[];
      error?: string;
    }>(response);
    if (!body || body.error) {
      return { status: "error", ip, detail: body?.error ?? "Shodan returned an unexpected response." };
    }

    const ports = [...new Set((body.ports ?? []).filter((port) => Number.isFinite(port)))].sort(
      (a, b) => a - b
    );
    const vulns = Object.keys(body.vulns ?? {}).slice(0, 20);
    const result: ShodanResult = {
      status: "ok",
      ip: body.ip_str ?? ip,
      org: body.org,
      ports,
      vulns,
      hostnames: (body.hostnames ?? []).slice(0, 5),
      detail:
        ports.length > 0 || vulns.length > 0
          ? `${ports.length} open port${ports.length === 1 ? "" : "s"} and ${vulns.length} known CVE${
              vulns.length === 1 ? "" : "s"
            } were reported for the hosting IP. This describes the server, not the page itself.`
          : "Shodan reported no exposed services or known vulnerabilities for this IP.",
    };
    await cacheSet(cacheId, result, DAY);
    return result;
  } catch (error) {
    return {
      status: "error",
      ip,
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "Shodan did not answer in time."
          : "Shodan could not be reached.",
    };
  }
}

/* ------------------------------------------------------------------ *
 * Have I Been Pwned — only the sender address, only with consent.
 * ------------------------------------------------------------------ */

export async function lookupBreaches(email: string): Promise<BreachResult> {
  const key = process.env.HIBP_API_KEY?.trim();
  const checkedEmail = email.trim().toLowerCase();
  if (!key) {
    return {
      status: "not_configured",
      checkedEmail,
      detail:
        "Breach lookup is off because HIBP_API_KEY is not set. The address was not sent anywhere.",
    };
  }

  const cacheId = cacheKey(["hibp", checkedEmail]);
  const cached = await cacheGet<BreachResult>(cacheId);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
        checkedEmail
      )}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": key,
          "User-Agent": "FakeShieldAI/1.0 (hackathon demo; consented breach check)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      const clean: BreachResult = {
        status: "none",
        checkedEmail,
        breachCount: 0,
        breaches: [],
        detail: "This address does not appear in Have I Been Pwned's known breach corpus.",
      };
      await cacheSet(cacheId, clean, DAY);
      return clean;
    }
    if (response.status === 401 || response.status === 403) {
      return {
        status: "error",
        checkedEmail,
        detail: "Have I Been Pwned rejected the configured API key.",
      };
    }
    if (response.status === 429) {
      return {
        status: "error",
        checkedEmail,
        detail: "Have I Been Pwned rate-limited this request. Try again in a minute.",
      };
    }
    if (!response.ok) {
      return { status: "error", checkedEmail, detail: `Have I Been Pwned returned HTTP ${response.status}.` };
    }

    const body = await readJson<
      { Name?: string; Title?: string; BreachDate?: string; DataClasses?: string[] }[]
    >(response);
    if (!Array.isArray(body)) {
      return { status: "error", checkedEmail, detail: "Have I Been Pwned returned an unexpected response." };
    }

    const result: BreachResult = {
      status: "ok",
      checkedEmail,
      breachCount: body.length,
      breaches: body.slice(0, 8).map((breach) => ({
        name: breach.Name ?? "Unknown breach",
        title: breach.Title ?? breach.Name ?? "Unknown breach",
        breachDate: breach.BreachDate,
        dataClasses: (breach.DataClasses ?? []).slice(0, 8),
      })),
      detail: `This address appears in ${body.length} known breach${body.length === 1 ? "" : "es"}. Change any reused password and enable two-factor authentication.`,
    };
    await cacheSet(cacheId, result, DAY);
    return result;
  } catch (error) {
    return {
      status: "error",
      checkedEmail,
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "The breach check timed out."
          : "Have I Been Pwned could not be reached.",
    };
  }
}

/**
 * Runs the URL intel lookups concurrently. Every provider fails
 * independently; a slow or missing key never blocks the analysis.
 */
export async function collectUrlThreatIntel(
  url: UrlDetails,
  domainIntel?: DomainIntel
): Promise<UrlThreatIntel> {
  const whois = whoisFromDomainIntel(domainIntel);
  const [virusTotal, ipGeo, ctLogs] = await Promise.all([
    lookupVirusTotal(url.normalized),
    lookupIpGeo(url.host),
    url.isIp ? Promise.resolve<CtLogResult>({ status: "none", detail: "CT logs apply to domain names." }) : lookupCtLogs(url.registrableDomain),
  ]);

  const shodan = await lookupShodan(ipGeo.status === "ok" ? ipGeo.ip ?? "" : url.isIp ? url.host : "");

  return { virusTotal, whois, ipGeo, ctLogs, shodan };
}
