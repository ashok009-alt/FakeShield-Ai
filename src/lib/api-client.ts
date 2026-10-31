import type { AnalysisResult } from "./analysis/types";
import type { CommunityResponse } from "./community";
import { SESSION_HEADER } from "./constants";
import type { PhoneLookup, PhoneReportCategory } from "./phone";
import { getSessionId } from "./session";
import type { HistoryFilters, StoredAnalysis, StatsResponse } from "./serialize";

const ANALYZE_TIMEOUT_MS = 20_000;
const READ_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  /** Hard deadline for the whole request, including stalls. */
  timeout?: number;
  /** Extra attempts for idempotent (GET) calls. Never used for writes. */
  retries?: number;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = READ_TIMEOUT_MS, retries = 0 } = options;
  const external = init?.signal ?? null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (external?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    const forwardAbort = () => controller.abort();
    if (external) external.addEventListener("abort", forwardAbort, { once: true });

    try {
      const response = await fetch(path, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          [SESSION_HEADER]: getSessionId(),
          ...(init?.headers ?? {}),
        },
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.ok) return payload as T;

      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : `Request failed (${response.status}).`;
      const error = new ApiError(message, response.status);

      // Retry only transient server failures on idempotent requests.
      if (response.status >= 500 && attempt < retries) {
        lastError = error;
      } else {
        throw error;
      }
    } catch (caught) {
      if (caught instanceof ApiError) throw caught;

      if (external?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }

      if (timedOut) {
        lastError = new ApiError("The server took too long to respond. Please try again.", 0);
      } else if (caught instanceof TypeError) {
        lastError = new ApiError("Network error. Check your connection and try again.", 0);
      } else {
        lastError = caught;
      }

      if (attempt >= retries) throw lastError;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener("abort", forwardAbort);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}

export function analyzeMessage(text: string, signal?: AbortSignal): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    "/api/analyze/message",
    { method: "POST", body: JSON.stringify({ text }), signal },
    { timeout: ANALYZE_TIMEOUT_MS }
  );
}

export interface EmailPayload {
  fromName?: string;
  fromEmail: string;
  replyTo?: string;
  subject: string;
  body: string;
  checkBreach?: boolean;
}

export function analyzeEmail(payload: EmailPayload, signal?: AbortSignal): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    "/api/analyze/email",
    { method: "POST", body: JSON.stringify(payload), signal },
    { timeout: ANALYZE_TIMEOUT_MS }
  );
}

export function analyzeUrl(url: string, signal?: AbortSignal): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    "/api/analyze/url",
    { method: "POST", body: JSON.stringify({ url }), signal },
    { timeout: ANALYZE_TIMEOUT_MS }
  );
}

export function analyzeForward(text: string, signal?: AbortSignal): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    "/api/analyze/forward",
    { method: "POST", body: JSON.stringify({ text }), signal },
    { timeout: ANALYZE_TIMEOUT_MS }
  );
}

export function analyzeLanguage(text: string, signal?: AbortSignal): Promise<AnalysisResult> {
  return request<AnalysisResult>(
    "/api/analyze/language",
    { method: "POST", body: JSON.stringify({ text }), signal },
    { timeout: ANALYZE_TIMEOUT_MS }
  );
}

export function lookupPhone(number: string, signal?: AbortSignal): Promise<PhoneLookup> {
  return request<PhoneLookup>(
    `/api/phone?number=${encodeURIComponent(number)}`,
    { signal },
    { timeout: 12_000, retries: 1 }
  );
}

export function reportPhone(
  payload: { number: string; category: PhoneReportCategory; note?: string },
  signal?: AbortSignal
): Promise<PhoneLookup> {
  return request<PhoneLookup>(
    "/api/phone",
    { method: "POST", body: JSON.stringify(payload), signal },
    { timeout: 12_000 }
  );
}

export function fetchCommunity(signal?: AbortSignal): Promise<CommunityResponse> {
  return request<CommunityResponse>("/api/community", { signal }, { retries: 1 });
}

export function fetchHistory(
  filters: HistoryFilters = {},
  signal?: AbortSignal
): Promise<{
  analyses: StoredAnalysis[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters.level && filters.level !== "all") params.set("level", filters.level);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  const query = params.toString();
  return request(`/api/history${query ? `?${query}` : ""}`, { signal }, { retries: 1 });
}

export function fetchAnalysis(id: string, signal?: AbortSignal): Promise<StoredAnalysis> {
  return request<StoredAnalysis>(
    `/api/history/${encodeURIComponent(id)}`,
    { signal },
    { retries: 1 }
  );
}

export function deleteAnalysis(id: string): Promise<{ deleted: boolean; id: string }> {
  return request(`/api/history/${id}`, { method: "DELETE" });
}

export function fetchStats(signal?: AbortSignal): Promise<StatsResponse> {
  return request("/api/stats", { signal }, { retries: 1 });
}
