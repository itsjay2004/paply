/**
 * Format a full author name as "First and middle initial(s) + full last name".
 * e.g. "John Doe" → "J Doe", "John Michael Doe" → "J M Doe".
 * Handles "Last, First Middle" format (e.g. "Doe, John" → "J Doe").
 */
export function formatAuthorName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';

  let parts: string[];
  if (trimmed.includes(',')) {
    const byComma = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const last = byComma[0];
    const firstMiddle = byComma.slice(1).join(' ');
    if (last === undefined) return trimmed;
    parts = firstMiddle ? [...firstMiddle.split(/\s+/).filter(Boolean), last] : [last];
  } else {
    parts = trimmed.split(/\s+/).filter(Boolean);
  }

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1] ?? '';
  const initials = parts
    .slice(0, -1)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .join(' ');
  return `${initials} ${lastName}`.trim();
}

/** Format an array of author names for storage. */
export function formatAuthorNames(names: string[]): string[] {
  if (!Array.isArray(names)) return [];
  return names.map((name) => formatAuthorName(String(name))).filter(Boolean);
}
