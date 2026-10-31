import { SESSION_STORAGE_KEY } from "./constants";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    // Private mode or blocked storage — use an in-memory ID for this tab.
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
