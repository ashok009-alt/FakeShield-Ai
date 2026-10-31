import type { SafeBrowsingResult } from "./types";

const ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

/**
 * Server-side only. Uses the Google Safe Browsing "find threat matches" API
 * (v4) when a key is configured. The key never leaves the server.
 */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: "not_configured",
      threats: [],
      detail: "No Safe Browsing API key configured — heuristic analysis only.",
    };
  }

  try {
    const response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: {
          clientId: "fakeshield-ai",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: "error",
        threats: [],
        detail: `Threat feed returned HTTP ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      matches?: { threatType?: string; platformType?: string }[];
    };

    const threats = [
      ...new Set(
        (data.matches ?? [])
          .map((match) => match.threatType)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    if (threats.length > 0) {
      return {
        status: "matched",
        threats,
        checkedAt: new Date().toISOString(),
        detail: "Google Safe Browsing returned a threat match.",
      };
    }

    return {
      status: "clean",
      threats: [],
      checkedAt: new Date().toISOString(),
      detail: "No match in Google Safe Browsing lists.",
    };
  } catch {
    return {
      status: "error",
      threats: [],
      detail: "Threat feed could not be reached — heuristic analysis only.",
    };
  }
}
