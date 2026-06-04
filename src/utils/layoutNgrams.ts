/**
 * layoutNgrams — fetch and cache the CloudFront-hosted ngram frequency index.
 *
 * The index lives at protected/units/ngrams/v1.json on the CDN and is built
 * by the rebuildNgramIndex Lambda (Admin-only mutation).
 *
 * The browser sends the CloudFront signed cookies (set in app/providers.tsx
 * by getUnitsCdnCookie) via `credentials: 'include'` — no extra auth needed.
 *
 * Results are cached in sessionStorage for the lifetime of the browser tab.
 */

const SESSION_KEY = "layout-ngrams-v1";

export interface NgramIndex {
  version: number;
  updatedAt: string;
  unitCount: number;
  /** Keys: single block type ("paragraph") or bigram ("heading|paragraph").
   *  Values: map of next block type → frequency count. */
  ngrams: Record<string, Record<string, number>>;
}

let _inMemoryCache: NgramIndex | null = null;

/**
 * Fetch the ngram index from CloudFront.
 * Returns null if the CDN domain is not configured or the fetch fails.
 */
export async function fetchNgramIndex(): Promise<NgramIndex | null> {
  // Return in-memory cache first (avoids sessionStorage parse on every call)
  if (_inMemoryCache) return _inMemoryCache;

  // Check sessionStorage
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        _inMemoryCache = JSON.parse(cached) as NgramIndex;
        return _inMemoryCache;
      }
    } catch {
      // Corrupted or quota-exceeded — continue to fetch
    }
  }

  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  if (!cdnDomain) {
    // CDN not configured (local dev without CloudFront) — return null gracefully
    return null;
  }

  try {
    const url = `https://${cdnDomain}/protected/units/ngrams/v1.json`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;

    const data = (await res.json()) as NgramIndex;
    _inMemoryCache = data;

    // Persist to sessionStorage for subsequent page navigations within this tab
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      } catch {
        // SessionStorage quota exceeded — in-memory cache still works
      }
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Get the probability distribution of next block types given the most recent
 * one or two block types. Returns an empty object if ngrams aren't loaded.
 */
export function getNextBlockSuggestions(
  index: NgramIndex,
  lastType: string,
  prevType?: string,
): Record<string, number> {
  const bigramKey = prevType ? `${prevType}|${lastType}` : null;

  // Prefer bigram if available (more specific)
  if (bigramKey && index.ngrams[bigramKey]) {
    return index.ngrams[bigramKey];
  }

  return index.ngrams[lastType] ?? {};
}

/** Invalidate the in-memory and sessionStorage cache (e.g. after admin rebuild). */
export function invalidateNgramCache(): void {
  _inMemoryCache = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
