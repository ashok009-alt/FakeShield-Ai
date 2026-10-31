export const PROTECT_NAME_MAX = 24;

/**
 * Builds a URL-safe display name. Unicode letters are kept so a name can be
 * written in its own script; everything else collapses to single hyphens.
 */
export function protectSlug(raw: string): string {
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PROTECT_NAME_MAX);
  return cleaned || "family";
}

export function protectDisplayName(slug: string): string {
  const decoded = safeDecode(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PROTECT_NAME_MAX);
  if (!decoded) return "Family";
  return decoded
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
