/**
 * Small JSON cache with two backends:
 *  - Upstash Redis REST when UPSTASH_REDIS_REST_URL + TOKEN are configured
 *    (shared across instances, 24-hour URL/threat caching);
 *  - an in-process Map otherwise, so local development works with no account.
 *
 * Every operation is best-effort. A cache outage must never fail an analysis.
 */

interface Entry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, Entry>();
const MAX_ENTRIES = 800;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstashEnabled = Boolean(upstashUrl && upstashToken);

export function cacheBackend(): "upstash" | "memory" {
  return upstashEnabled ? "upstash" : "memory";
}

function prune(now: number) {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
  if (memory.size > MAX_ENTRIES) {
    let remove = memory.size - MAX_ENTRIES;
    for (const key of memory.keys()) {
      memory.delete(key);
      remove -= 1;
      if (remove <= 0) break;
    }
  }
}

async function upstashCommand(args: string[]): Promise<unknown> {
  if (!upstashEnabled) return null;
  const response = await fetch(`${upstashUrl}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(2500),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash HTTP ${response.status}`);
  const payload = (await response.json()) as { result?: unknown };
  return payload.result ?? null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now();
  if (upstashEnabled) {
    try {
      const raw = await upstashCommand(["GET", key]);
      if (typeof raw === "string") return JSON.parse(raw) as T;
    } catch {
      // Fall through to the process cache rather than failing the request.
    }
  }
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    memory.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const serialized = JSON.stringify(value);
  memory.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
  prune(Date.now());

  if (!upstashEnabled) return;
  try {
    await upstashCommand(["SET", key, serialized, "EX", String(Math.max(1, Math.floor(ttlSeconds)))]);
  } catch {
    /* cache is an optimisation only */
  }
}

export function cacheKey(parts: Array<string | number>): string {
  return ["fakeshield", ...parts].join(":");
}
