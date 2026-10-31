import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

// Process-local fixed-window limiter. Adequate for this single-instance demo;
// swap for a shared store (Redis/Upstash) if the app is deployed on many nodes.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;
let inserts = 0;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap: drop the oldest insertions rather than grow without bound.
  if (buckets.size > MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  inserts += 1;
  if (inserts % 500 === 0) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests from this session. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfter)),
        "Cache-Control": "private, no-store",
      },
    }
  );
}

/* ---------------------------------------------------------------------------
   Shared IP limiter.

   When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured the
   counter lives in Redis, so limits hold across serverless instances. Without
   credentials it degrades to the in-process bucket above, which is correct for
   a single local server but is not shared between instances.
--------------------------------------------------------------------------- */

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export function rateLimitBackend(): "upstash" | "memory" {
  return upstashUrl && upstashToken ? "upstash" : "memory";
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (!upstashUrl || !upstashToken) return null;
  try {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const response = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
        ["PTTL", key],
      ]),
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(payload[0]?.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) return null;
    const pttl = Number(payload[2]?.result ?? 0);
    const retryAfter = pttl > 0 ? Math.ceil(pttl / 1000) : Math.ceil(windowMs / 1000);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: count <= limit ? 0 : Math.max(1, retryAfter),
    };
  } catch {
    return null;
  }
}

/**
 * Fixed-window, per-IP limiter. Defaults match the documented deployment:
 * 10 analysis requests per minute per IP address.
 */
export async function rateLimitRequest(
  request: Request,
  scope: string,
  limit = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowIndex = Math.floor(now / windowMs);
  const ip = clientIp(request);
  const key = `fakeshield:rl:${scope}:${ip}:${windowIndex}`;

  const shared = await upstashRateLimit(key, limit, windowMs);
  if (shared) return shared;

  return rateLimit(key, limit, windowMs);
}
