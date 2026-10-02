export interface FuzzyMatch {
  /** Lower is better. Contiguous substring matches always outrank scattered ones. */
  score: number;
  /** Character positions in the original text that matched the query. */
  indices: number[];
}

/**
 * Case-insensitive fuzzy match: prefers a contiguous substring, otherwise
 * accepts the query characters appearing in order (e.g. "ajn" → "Alice Johnson").
 * Returns null when the text does not match; an empty query matches everything.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return { score: 0, indices: [] };

  const haystack = text.toLowerCase();
  const start = haystack.indexOf(needle);
  if (start !== -1) {
    return {
      score: start,
      indices: Array.from({ length: needle.length }, (_, i) => start + i),
    };
  }

  const indices: number[] = [];
  let cursor = 0;
  for (const char of needle) {
    if (char === " ") continue;
    cursor = haystack.indexOf(char, cursor);
    if (cursor === -1) return null;
    indices.push(cursor);
    cursor += 1;
  }
  if (indices.length === 0) return null;

  const gaps = indices[indices.length - 1] - indices[0] + 1 - indices.length;
  return { score: 1000 + gaps + indices[0], indices };
}
