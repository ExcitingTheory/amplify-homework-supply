"use client";

import * as React from "react";
import AuthContext from "@/context/authContext";
import { embed } from "@/offline/LocalEmbeddingModel";
import {
  loadInstructorBundle,
  loadPlatformBundle,
  search,
  type SearchBundle,
} from "@/utils/searchBundles";

export type AdminSearchType =
  | "unit"
  | "file"
  | "word"
  | "question"
  | "section";

export type AdminSearchSource = "platform" | "instructor" | "none";

export interface AdminSearchHit {
  id: string;
  title: string;
  score: number;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 200;
// Bundle search ranks every type together, so over-fetch before filtering by type.
const RANK_POOL = 2000;
const SEMANTIC_THRESHOLD = 0.3;
// Multi-page items (e.g. PDFs) are indexed per page as `${id}-p${page}`.
const PAGE_SUFFIX = /-p\d+$/;

/**
 * Ranks a bundle for `queryText` and collapses the result to record ids of the
 * requested types (best page wins for multi-page items).
 */
export function rankBundleHits({
  bundle,
  embedding,
  queryText,
  types,
  limit = RESULT_LIMIT,
}: {
  bundle: SearchBundle;
  embedding: number[];
  queryText: string;
  types: ReadonlyArray<AdminSearchType>;
  limit?: number;
}): AdminSearchHit[] {
  const ranked = search(
    embedding,
    bundle,
    RANK_POOL,
    SEMANTIC_THRESHOLD,
    queryText,
  );
  const best = new Map<string, AdminSearchHit>();
  for (const { item, score } of ranked) {
    if (!types.includes(item.type)) continue;
    const id = item.id.replace(PAGE_SUFFIX, "");
    if (!best.has(id)) best.set(id, { id, title: item.title, score });
  }
  return Array.from(best.values()).slice(0, limit);
}

/**
 * Semantic hits first (in rank order), then any remaining lexical matches in
 * their original order. The union keeps records that are newer than the
 * search bundle findable, and falls back to pure lexical when there are no hits.
 */
export function mergeSearchResults<T extends { id: string }>(
  items: readonly T[],
  hits: readonly AdminSearchHit[] | null,
  matchesLexically: (item: T) => boolean,
): T[] {
  const lexical = items.filter(matchesLexically);
  if (!hits || hits.length === 0) return lexical;

  const byId = new Map(items.map((item) => [item.id, item]));
  const semantic: T[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    const item = byId.get(hit.id);
    if (item && !seen.has(hit.id)) {
      seen.add(hit.id);
      semantic.push(item);
    }
  }
  return [...semantic, ...lexical.filter((item) => !seen.has(item.id))];
}

interface LoadedBundle {
  bundle: SearchBundle;
  source: Exclude<AdminSearchSource, "none">;
}

let bundleCache: { key: string; promise: Promise<LoadedBundle | null> } | null =
  null;

/**
 * The platform-wide bundle for Admins (when built), otherwise the caller's own
 * instructor bundle. Loaded lazily on first search and shared across
 * admin pages.
 */
function loadAdminBundle(
  identityId: string,
  usePlatform: boolean,
): Promise<LoadedBundle | null> {
  const key = `${identityId}:${usePlatform}`;
  if (bundleCache?.key === key) return bundleCache.promise;

  const promise = (async (): Promise<LoadedBundle | null> => {
    if (usePlatform) {
      const platform = await loadPlatformBundle();
      if (platform) return { bundle: platform, source: "platform" };
    }
    const instructor = await loadInstructorBundle(identityId);
    return instructor ? { bundle: instructor, source: "instructor" } : null;
  })();

  bundleCache = { key, promise };
  // Do not pin a failed/empty load; a later search should retry.
  promise
    .then((loaded) => {
      if (!loaded && bundleCache?.promise === promise) bundleCache = null;
    })
    .catch(() => {
      if (bundleCache?.promise === promise) bundleCache = null;
    });
  return promise;
}

export function resetAdminSearchCache(): void {
  bundleCache = null;
}

export type AdminSearchScope = "platform" | "own";

export interface UseAdminSemanticSearchOptions {
  enabled?: boolean;
  /**
   * "platform" (default) searches every instructor's content for Admins, who
   * are the only role that may read it; everyone else always gets their own
   * bundle. "own" forces the caller's own bundle even for Admins, for surfaces
   * that must not reveal other instructors' records.
   */
  scope?: AdminSearchScope;
  debounceMs?: number;
  limit?: number;
}

export interface AdminSemanticSearchState {
  /** Ranked hits, or null when there is no query / no index / search failed. */
  hits: AdminSearchHit[] | null;
  searching: boolean;
  source: AdminSearchSource;
}

/**
 * Debounced semantic search over the admin search bundle. Never throws:
 * when the index or embedding model is unavailable `hits` stays null and
 * callers keep their lexical behavior.
 */
export function useAdminSemanticSearch(
  query: string,
  types: AdminSearchType | ReadonlyArray<AdminSearchType>,
  {
    enabled = true,
    scope = "platform",
    debounceMs = DEBOUNCE_MS,
    limit = RESULT_LIMIT,
  }: UseAdminSemanticSearchOptions = {},
): AdminSemanticSearchState {
  const { session } = React.useContext(AuthContext) as unknown as {
    session?: { identityId?: string; groups?: string[] };
  };
  const identityId = session?.identityId;
  const usePlatform =
    scope === "platform" && !!session?.groups?.includes("Admins");
  const typeKey = (Array.isArray(types) ? types : [types]).join(",");
  const trimmed = query.trim();
  const active = enabled && !!identityId && trimmed.length >= MIN_QUERY_LENGTH;

  const [state, setState] = React.useState<AdminSemanticSearchState>({
    hits: null,
    searching: false,
    source: "none",
  });

  React.useEffect(() => {
    if (!active || !identityId) {
      setState((prev) =>
        prev.hits === null && !prev.searching
          ? prev
          : { hits: null, searching: false, source: prev.source },
      );
      return;
    }

    let cancelled = false;
    // Drop hits for the previous text so stale semantic matches never show.
    setState((prev) => ({ hits: null, searching: true, source: prev.source }));

    const timer = setTimeout(async () => {
      try {
        const loaded = await loadAdminBundle(identityId, usePlatform);
        if (cancelled) return;
        if (!loaded) {
          setState({ hits: null, searching: false, source: "none" });
          return;
        }
        const { embedding } = await embed(trimmed);
        if (cancelled) return;
        const hits = rankBundleHits({
          bundle: loaded.bundle,
          embedding,
          queryText: trimmed,
          types: typeKey.split(",") as AdminSearchType[],
          limit,
        });
        setState({ hits, searching: false, source: loaded.source });
      } catch (err) {
        if (cancelled) return;
        console.warn("[adminSemanticSearch] Semantic search unavailable:", err);
        setState({ hits: null, searching: false, source: "none" });
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, identityId, usePlatform, trimmed, typeKey, debounceMs, limit]);

  return state;
}
