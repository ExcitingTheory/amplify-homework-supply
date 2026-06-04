import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { generateEmbedding } from "../../app/actions/embeddings";
import {
  search,
  loadUnitBundle,
  loadInstructorBundle,
  type SearchBundle,
  type SearchResult as BundleSearchResult,
} from "../utils/searchBundles";

export interface SearchResult {
  type: "unit" | "file" | "word" | "question" | "section";
  id: string;
  title: string;
  description?: string;
  score: number;
  page?: number;
  highlightTerm?: string;
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
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const bundleRef = React.useRef<SearchBundle | null>(null);

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
      // Generate query embedding
      const { embedding } = await generateEmbedding({ content: query });

      // Search loaded bundle
      const bundle = bundleRef.current;
      if (!bundle) {
        setState((prev) => ({ ...prev, results: [], searching: false }));
        return;
      }

      const bundleResults = search(embedding, bundle, 10, 0.3);

      const results: SearchResult[] = bundleResults.map(
        (r: BundleSearchResult) => ({
          type: r.item.type,
          id: r.item.id,
          title: r.item.title,
          description: r.item.meta.preview,
          score: r.score,
          page: r.item.meta.page,
          highlightTerm: query,
        }),
      );

      setState((prev) => ({ ...prev, results, searching: false }));
    } catch (err) {
      console.error("[SearchContext] Search failed:", err);
      setState((prev) => ({ ...prev, results: [], searching: false }));
    }
  }, []);

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
