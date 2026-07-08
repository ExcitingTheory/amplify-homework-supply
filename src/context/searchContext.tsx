import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { embed, isModelReady, loadModel } from "../offline/LocalEmbeddingModel";
import ChatContext from "./chatContext";
import AuthContext from "./authContext";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  search,
  loadUnitBundle,
  loadInstructorBundle,
  type SearchBundle,
  type SearchResult as BundleSearchResult,
} from "../utils/searchBundles";

export interface SearchResult {
  type: "unit" | "file" | "word" | "question" | "section" | "chat";
  id: string;
  title: string;
  description?: string;
  score: number;
  page?: number;
  highlightTerm?: string;
  role?: "user" | "assistant" | "unknown";
}

type SearchType = "unit" | "file" | "word" | "question" | "section" | "chat";

interface ParsedSearchQuery {
  query: string;
  type?: SearchType;
  role?: "user" | "assistant";
  author?: string;
}

interface LearnerScopeItem {
  type: "unit" | "section" | "file";
  id: string;
  title: string;
  description?: string;
}

interface LearnerScopeData {
  sections: LearnerScopeItem[];
  units: LearnerScopeItem[];
  files: LearnerScopeItem[];
}

const TYPE_ALIASES: Record<string, SearchType> = {
  file: "file",
  files: "file",
  unit: "unit",
  units: "unit",
  word: "word",
  words: "word",
  question: "question",
  questions: "question",
  section: "section",
  sections: "section",
  chat: "chat",
  chats: "chat",
};

function parseSearchQuery(raw: string): ParsedSearchQuery {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  let type: SearchType | undefined;
  let role: "user" | "assistant" | undefined;
  let author: string | undefined;
  const retained: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (lower.startsWith("type:")) {
      const candidate = lower.slice(5);
      type = TYPE_ALIASES[candidate] || type;
      continue;
    }

    const fieldAliasMatch = lower.match(/^(@|\/)?(file|files|unit|units|word|words|question|questions|section|sections|chat|chats):?(.*)$/);
    if (fieldAliasMatch) {
      const alias = fieldAliasMatch[2];
      const trailing = fieldAliasMatch[3];
      type = TYPE_ALIASES[alias] || type;
      if (trailing) retained.push(trailing);
      continue;
    }

    if (lower.startsWith("from:")) {
      const candidate = token.slice(5).trim();
      const candidateLower = candidate.toLowerCase();
      if (candidateLower === "user" || candidateLower === "assistant") {
        role = candidateLower;
      } else if (candidate.length > 0) {
        author = candidate;
      }
      continue;
    }

    retained.push(token);
  }

  return {
    query: retained.join(" ").trim(),
    type,
    role,
    author,
  };
}

function normalizeText(value: string): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function lexicalScore(text: string, query: string): number {
  const q = tokenize(query);
  if (q.length === 0) return 0;
  const docTokens = tokenize(text);
  if (docTokens.length === 0) return 0;

  const tf = new Map<string, number>();
  for (const token of docTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  let score = 0;
  for (const token of q) {
    const freq = tf.get(token) || 0;
    if (freq > 0) {
      score += 1 + Math.log(1 + freq);
    }
  }

  const normalizedDoc = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery && normalizedDoc.includes(normalizedQuery)) {
    score += 1.5;
  }

  return score;
}

function searchLearnerScope(
  scope: LearnerScopeData,
  query: string,
  type?: SearchType,
): SearchResult[] {
  const includeUnits = type == null || type === "unit";
  const includeSections = type == null || type === "section";
  const includeFiles = type == null || type === "file";
  const pool: LearnerScopeItem[] = [];

  if (includeUnits) pool.push(...scope.units);
  if (includeSections) pool.push(...scope.sections);
  if (includeFiles) pool.push(...scope.files);

  const scored = pool
    .map((item) => {
      const haystack = `${item.title} ${item.description || ""}`;
      const score = lexicalScore(haystack, query);
      return { item, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const maxScore = scored.reduce(
    (max, candidate) => (candidate.score > max ? candidate.score : max),
    0,
  );

  return scored.map(({ item, score }) => ({
    type: item.type,
    id: item.id,
    title: item.title,
    description: item.description,
    score: maxScore > 0 ? score / maxScore : score,
    highlightTerm: query,
  }));
}

interface SearchState {
  query: string;
  results: SearchResult[];
  searching: boolean;
  open: boolean;
}

interface SearchContextValue extends SearchState {
  setQuery: (query: string) => void;
  executeSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  setOpen: (open: boolean) => void;
}

const SearchContext = React.createContext<SearchContextValue>({
  query: "",
  results: [],
  searching: false,
  open: false,
  setQuery: () => {},
  executeSearch: async () => {},
  clearSearch: () => {},
  setOpen: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SearchState>({
    query: "",
    results: [],
    searching: false,
    open: false,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { session } = React.useContext(AuthContext) as unknown as { session: { groups?: string[]; identityId?: string } };
  const { searchChatMessagesAsync } = React.useContext(ChatContext) as { searchChatMessagesAsync: (query: string, options?: { limit?: number; role?: string; author?: string }) => Promise<any[]> };
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const bundleRef = React.useRef<SearchBundle | null>(null);
  const loadingBundleRef = React.useRef<Promise<SearchBundle | null> | null>(
    null,
  );
  const learnerScopeRef = React.useRef<LearnerScopeData>({
    sections: [],
    units: [],
    files: [],
  });
  const loadingLearnerScopeRef = React.useRef<Promise<LearnerScopeData> | null>(
    null,
  );

  const currentUnitId = React.useMemo(() => {
    const unitMatch = pathname?.match(/\/unit\/([^/?#]+)/);
    if (unitMatch) return unitMatch[1];
    const workbookMatch = pathname?.match(/\/workbook\/([^/?#]+)/);
    if (workbookMatch) return workbookMatch[1];
    return null;
  }, [pathname]);

  const groups = session?.groups || [];
  const isPrivileged = React.useMemo(
    () =>
      groups.some((g: string) =>
        ["Admins", "Moderators", "Instructors"].includes(g),
      ),
    [groups],
  );

  const loadLearnerScope = React.useCallback(async (): Promise<LearnerScopeData> => {
    if (loadingLearnerScopeRef.current) {
      return loadingLearnerScopeRef.current;
    }

    const client = getAmplifyClient();

    loadingLearnerScopeRef.current = (async () => {
      const [assignmentsResult, sectionsResult] = await Promise.all([
        client.models.Assignment.list(),
        client.models.Section.list(),
      ]);

      const assignments = (assignmentsResult?.data || []).filter(
        (item: any) => item != null && item.id != null && item.deletedAt == null,
      );
      const sections = (sectionsResult?.data || []).filter(
        (item: any) => item != null && item.id != null && item.deletedAt == null,
      );

      const sectionById = new Map<string, any>();
      sections.forEach((section: any) => sectionById.set(section.id, section));

      const unitIds = new Set<string>();
      const sectionIds = new Set<string>();
      assignments.forEach((assignment: any) => {
        if (assignment.unitID) unitIds.add(assignment.unitID);
        if (assignment.sectionID) sectionIds.add(assignment.sectionID);
      });

      const units = await Promise.all(
        Array.from(unitIds).map(async (unitId) => {
          try {
            const response = await client.models.Unit.get({ id: unitId });
            return response?.data || null;
          } catch {
            return null;
          }
        }),
      );

      const unitFileResult = await client.models.UnitFile.list();
      const unitFiles = (unitFileResult?.data || []).filter(
        (item: any) =>
          item != null &&
          item.id != null &&
          item.deletedAt == null &&
          item.unitID != null &&
          unitIds.has(item.unitID) &&
          item.fileID != null,
      );
      const fileIds = Array.from(new Set(unitFiles.map((item: any) => item.fileID)));
      const files = await Promise.all(
        fileIds.map(async (fileId) => {
          try {
            const response = await client.models.File.get({ id: fileId });
            return response?.data || null;
          } catch {
            return null;
          }
        }),
      );

      const sectionItems: LearnerScopeItem[] = Array.from(sectionIds)
        .map((sectionId) => sectionById.get(sectionId))
        .filter((section) => section != null)
        .map((section: any) => ({
          type: "section",
          id: section.id,
          title: section.name || "Section",
          description: section.description || section.code,
        }));

      const unitItems: LearnerScopeItem[] = units
        .filter((unit) => unit != null && unit.deletedAt == null)
        .map((unit: any) => ({
          type: "unit",
          id: unit.id,
          title: unit.name || "Unit",
          description: unit.description || undefined,
        }));

      const fileItems: LearnerScopeItem[] = files
        .filter((file) => file != null && file.deletedAt == null)
        .map((file: any) => ({
          type: "file",
          id: file.id,
          title: file.name || "File",
          description:
            file.description ||
            file.mimeType ||
            file.path ||
            undefined,
        }));

      return {
        sections: sectionItems,
        units: unitItems,
        files: fileItems,
      };
    })();

    try {
      const scope = await loadingLearnerScopeRef.current;
      learnerScopeRef.current = scope;
      return scope;
    } finally {
      loadingLearnerScopeRef.current = null;
    }
  }, []);

  const loadBestBundle = React.useCallback(async () => {
    const identityId = session?.identityId;
    if (!identityId) return null;

    if (!isPrivileged) {
      bundleRef.current = null;
      return null;
    }

    if (loadingBundleRef.current) {
      return loadingBundleRef.current;
    }

    loadingBundleRef.current = (async () => {
      // Privileged users get full content search bundle.
      const instructorBundle = await loadInstructorBundle(identityId);
      if (instructorBundle) return instructorBundle;

      // Safety fallback for privileged users currently in a unit route.
      if (currentUnitId) {
        const unitBundle = await loadUnitBundle(identityId, currentUnitId);
        if (unitBundle) return unitBundle;
      }

      return null;
    })();

    try {
      const bundle = await loadingBundleRef.current;
      bundleRef.current = bundle;
      return bundle;
    } finally {
      loadingBundleRef.current = null;
    }
  }, [session?.identityId, currentUnitId, isPrivileged]);

  React.useEffect(() => {
    let cancelled = false;

    async function preloadData() {
      if (isPrivileged) {
        const bundle = await loadBestBundle();

        if (!cancelled) {
          bundleRef.current = bundle;
        }
        return;
      }

      const scope = await loadLearnerScope();

      if (!cancelled) {
        learnerScopeRef.current = scope;
      }
    }

    preloadData();
    return () => {
      cancelled = true;
    };
  }, [loadBestBundle, loadLearnerScope, isPrivileged]);

  // Read initial query from URL
  React.useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== state.query) {
      setState((prev) => ({ ...prev, query: q }));
      executeSearch(q);
    }
  }, []);

  const setQuery = React.useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, query, open: true }));

      // Debounce search execution
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (query.trim().length >= 2) {
          executeSearch(query);
        } else {
          setState((prev) => ({ ...prev, results: [], searching: false }));
        }
      }, 300);
    },
    [],
  );

  const executeSearch = React.useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState((prev) => ({ ...prev, searching: true }));

    try {
      const parsed = parseSearchQuery(query);
      const cleanQuery = parsed.query;
      if (!cleanQuery) {
        setState((prev) => ({ ...prev, results: [], searching: false }));
        return;
      }

      const results: SearchResult[] = [];
      const includeBundle =
        isPrivileged && (parsed.type == null || parsed.type !== "chat");
      const includeLearnerScope =
        !isPrivileged &&
        (parsed.type == null ||
          parsed.type === "unit" ||
          parsed.type === "section" ||
          parsed.type === "file");
      const includeChat = parsed.type == null || parsed.type === "chat";

      if (includeBundle) {
        let bundle = bundleRef.current;
        if (!bundle) {
          bundle = await loadBestBundle();
        }
        if (bundle) {
          const { embedding } = await embed(cleanQuery);
          const bundleResults = search(embedding, bundle, 10, 0.3, cleanQuery);
          const mappedBundle = bundleResults
            .map(
              (r: BundleSearchResult) => ({
                type: r.item.type,
                id: r.item.id,
                title: r.item.title,
                description: r.item.meta.preview,
                score: r.score,
                page: r.item.meta.page,
                highlightTerm: cleanQuery,
              }) as SearchResult,
            )
            .filter((r) => (parsed.type ? r.type === parsed.type : true));

          results.push(...mappedBundle);
        }
      }

      if (includeLearnerScope) {
        let scope = learnerScopeRef.current;
        if (
          scope.sections.length === 0 &&
          scope.units.length === 0 &&
          scope.files.length === 0
        ) {
          scope = await loadLearnerScope();
        }
        const scopedResults = searchLearnerScope(scope, cleanQuery, parsed.type);
        results.push(...scopedResults);
      }

      if (includeChat) {
        const chatMatches = await searchChatMessagesAsync(cleanQuery, {
          limit: 10,
          role: parsed.role,
          author: parsed.author,
        });

        const mappedChat: SearchResult[] = (chatMatches || []).map((m: any) => ({
          type: "chat",
          id: m.id,
          title: m.role === "assistant" ? "Assistant message" : "Your message",
          description: m.snippet,
          score: m.score,
          highlightTerm: cleanQuery,
          role: m.role || "unknown",
        }));

        results.push(...mappedChat);
      }

      results.sort((a, b) => b.score - a.score);

      setState((prev) => ({ ...prev, results, searching: false }));
    } catch (err) {
      console.error("[SearchContext] Search failed:", err);
      setState((prev) => ({ ...prev, results: [], searching: false }));
    }
  }, [searchChatMessagesAsync, loadBestBundle, loadLearnerScope, isPrivileged]);

  const clearSearch = React.useCallback(() => {
    setState({ query: "", results: [], searching: false, open: false });
    // Remove ?q= from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    router.replace(newUrl);
  }, [searchParams, router]);

  const setOpen = React.useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  }, []);

  const value = React.useMemo(
    () => ({
      ...state,
      setQuery,
      executeSearch,
      clearSearch,
      setOpen,
    }),
    [state, setQuery, executeSearch, clearSearch, setOpen],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  return React.useContext(SearchContext);
}

/**
 * Load a search bundle into the search context.
 * Call from components that know the user's role and current unit.
 */
export function useLoadSearchBundle() {
  const bundleRef = React.useRef<SearchBundle | null>(null);

  const loadForUnit = React.useCallback(
    async (identityId: string, unitId: string) => {
      const bundle = await loadUnitBundle(identityId, unitId);
      bundleRef.current = bundle;
    },
    [],
  );

  const loadForInstructor = React.useCallback(
    async (identityId: string) => {
      const bundle = await loadInstructorBundle(identityId);
      bundleRef.current = bundle;
    },
    [],
  );

  return { loadForUnit, loadForInstructor };
}

export default SearchContext;
