// lib/scrapers/parser-utils.ts
// Shared helpers for extracting price, grade, and date from scraped text.

/**
 * Parse a price string like "$4,500", "4500.00", "4,500" → number.
 * Returns null if unparseable.
 */
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? null : val;
}

const GRADE_PATTERN =
  /\b(PSA|BGS|SGC|CGC|CSG|HGA|GAI|KSA)\s*(\d{1,2}(?:\.\d)?)\b/i;

const STANDALONE_GRADE =
  /\b(Gem\s*Mint|Mint|Near\s*Mint|Excellent|Very\s*Good|Good|Fair|Poor|Authentic|Auth)\b/i;

/**
 * Extract a grading label from a title or grade string.
 * Returns something like "PSA 9", "BGS 9.5", "SGC 10", "Mint", or null.
 */
export function extractGrade(text: string | null | undefined): string | null {
  if (!text) return null;

  const m = text.match(GRADE_PATTERN);
  if (m) return `${m[1].toUpperCase()} ${m[2]}`;

  const s = text.match(STANDALONE_GRADE);
  if (s) return s[0].replace(/\s+/g, ' ').trim();

  return null;
}

/**
 * Normalise a date string to YYYY-MM-DD.
 * Accepts ISO strings, "Aug 28, 2026", "08/28/2026", timestamps, etc.
 * Returns today's date string if unparseable.
 */
export function normaliseDate(raw: string | null | undefined): string {
  if (!raw) return todayStr();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();

  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return todayStr();
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate a simple stable ID for a listing.
 */
export function makeId(prefix: string, text: string, price: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  return `${prefix}-${slug}-${price}`;
}

/**
 * Deduplicate an array of objects by a key function.
 */
export function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
