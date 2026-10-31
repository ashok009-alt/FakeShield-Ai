import type { DomainIntel, UrlDetails } from "./types";

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: unknown[];
  entities?: RdapEntity[];
}

interface RdapResponse {
  events?: RdapEvent[];
  entities?: RdapEntity[];
  status?: string[];
}

const RDAP_ENDPOINT = "https://rdap.org/domain";
const TIMEOUT_MS = 5000;

function vcardName(entity: RdapEntity): string | undefined {
  const vcard = entity.vcardArray;
  if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return undefined;
  for (const entry of vcard[1]) {
    if (Array.isArray(entry) && entry[0] === "fn" && typeof entry[3] === "string") {
      return entry[3];
    }
  }
  return undefined;
}

function findRegistrar(entities: RdapEntity[] | undefined): string | undefined {
  if (!entities) return undefined;
  for (const entity of entities) {
    if (entity.roles?.includes("registrar")) {
      return vcardName(entity) ?? "Registrar listed in public records";
    }
    const nested = findRegistrar(entity.entities);
    if (nested) return nested;
  }
  return undefined;
}

function eventDate(events: RdapEvent[] | undefined, action: string): string | undefined {
  return events?.find((event) => event.eventAction?.toLowerCase() === action)?.eventDate;
}

/**
 * Looks up registration metadata in the public RDAP registry. This is a
 * registry query — it never connects to, loads or renders the submitted URL.
 */
export async function lookupDomainIntel(details: UrlDetails): Promise<DomainIntel> {
  const checkedAt = new Date().toISOString();

  if (details.isIp) {
    return {
      status: "not_applicable",
      source: "rdap",
      checkedAt,
      detail: "IP hosts do not have a public domain registration record.",
    };
  }

  const domain = details.registrableDomain;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return {
      status: "not_applicable",
      source: "rdap",
      checkedAt,
      detail: "No registrable domain to look up.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${RDAP_ENDPOINT}/${encodeURIComponent(domain)}`, {
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent": "FakeShieldAI/1.0 (hackathon demo; registry metadata only)",
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });

    if (response.status === 404) {
      return {
        status: "not_found",
        source: "rdap",
        checkedAt,
        detail: "The public registry has no registration record for this domain.",
      };
    }
    if (!response.ok) {
      return {
        status: "unavailable",
        source: "rdap",
        checkedAt,
        detail: `Registry lookup returned HTTP ${response.status}.`,
      };
    }

    const data = (await response.json()) as RdapResponse;
    const registeredAt = eventDate(data.events, "registration");
    const updatedAt = eventDate(data.events, "last changed") ?? eventDate(data.events, "last update of rdap database");
    const expiresAt = eventDate(data.events, "expiration");

    let ageDays: number | undefined;
    if (registeredAt) {
      const registered = new Date(registeredAt).getTime();
      if (Number.isFinite(registered)) {
        ageDays = Math.max(0, Math.floor((Date.now() - registered) / 86_400_000));
      }
    }

    return {
      status: "ok",
      source: "rdap",
      checkedAt,
      ageDays,
      registeredAt,
      updatedAt,
      expiresAt,
      registrar: findRegistrar(data.entities),
      detail: ageDays !== undefined
        ? `Registered ${ageDays.toLocaleString("en-IN")} days ago, according to public registry records.`
        : "The public registry record does not list a registration date.",
    };
  } catch {
    return {
      status: "unavailable",
      source: "rdap",
      checkedAt,
      detail: "The public registry could not be reached, so domain age is unknown.",
    };
  } finally {
    clearTimeout(timer);
  }
}
