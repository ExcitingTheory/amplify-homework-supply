"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper, { type PaperProps } from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { getAmplifyClient } from "@/utils/amplifyClient";
import AuthContext from "@/context/authContext";
import { useAdminSemanticSearch } from "./adminSemanticSearch";

export const ALL_SECTIONS_ID = "all";

export interface SectionOption {
  id: string;
  label: string;
  code?: string | null;
}

export interface SectionPage {
  options: SectionOption[];
  nextToken: string | null;
}

export interface SectionListArgs {
  limit: number;
  nextToken?: string | null;
}

export interface SectionListResult {
  data?: Array<Record<string, any> | null> | null;
  nextToken?: string | null;
  errors?: unknown[] | null;
}

export type SectionListFn = (args: SectionListArgs) => Promise<SectionListResult>;

const PAGE_SIZE = 25;
const SCAN_LIMIT_FILTERED = 500;
const SCAN_LIMIT_UNFILTERED = 50;
const MAX_SCAN_PAGES = 10;
const SEARCH_DEBOUNCE_MS = 300;

const defaultListSections: SectionListFn = (args) =>
  (getAmplifyClient().models as any).Section.list({
    ...args,
    // Skip heavy fields (embedding, schedules, student progress) for a dropdown.
    selectionSet: ["id", "name", "code"],
  });

function matchesQuery(section: Record<string, any>, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return [section.name, section.code].some(
    (field) => typeof field === "string" && field.toLowerCase().includes(needle),
  );
}

/**
 * Fetches the next page of sections matching `query`.
 *
 * AppSync applies filter expressions after the page limit, so a server-side
 * `contains` filter can return empty pages while more matches exist, and it is
 * case sensitive. Instead this scans pages with a light selection set and
 * matches case-insensitively, stopping once a full page of matches is found or
 * the scan budget is spent. A non-null `nextToken` means more may exist.
 */
export async function searchSectionPage({
  list,
  query,
  nextToken = null,
  pageSize = PAGE_SIZE,
  maxPages = MAX_SCAN_PAGES,
}: {
  list: SectionListFn;
  query: string;
  nextToken?: string | null;
  pageSize?: number;
  maxPages?: number;
}): Promise<SectionPage> {
  const limit = query ? SCAN_LIMIT_FILTERED : SCAN_LIMIT_UNFILTERED;
  const options: SectionOption[] = [];
  let token: string | null = nextToken;

  for (let page = 0; page < maxPages; page++) {
    const result = await list({ limit, nextToken: token });
    if (result.errors?.length && !result.data?.length) {
      throw new Error("Failed to list sections");
    }
    for (const section of result.data ?? []) {
      if (section?.id && matchesQuery(section, query)) {
        options.push({
          id: section.id,
          label: section.name || section.id,
          code: section.code ?? null,
        });
      }
    }
    token = result.nextToken ?? null;
    if (!token || options.length >= pageSize) break;
  }

  return { options, nextToken: token };
}

interface FooterPaperProps extends PaperProps {
  footer?: React.ReactNode;
}

const FooterPaper = React.forwardRef<HTMLDivElement, FooterPaperProps>(
  function FooterPaper({ footer, children, ...rest }, ref) {
    return (
      <Paper ref={ref} {...rest}>
        {children}
        {footer}
      </Paper>
    );
  },
);

export interface AdminSectionSelectProps {
  /** Selected section id, or `ALL_SECTIONS_ID` for the unscoped option. */
  value: string;
  onChange: (sectionId: string) => void;
  label?: string;
  allLabel?: string;
  minWidth?: number;
  /** Override the data source (defaults to the Amplify `Section` model). */
  listSections?: SectionListFn;
}

/**
 * Typeahead section picker that searches and pages through sections on demand
 * instead of loading every section up front.
 */
export default function AdminSectionSelect({
  value,
  onChange,
  label = "Section",
  allLabel = "All Sections (Platform)",
  minWidth = 220,
  listSections = defaultListSections,
}: AdminSectionSelectProps) {
  const allOption = React.useMemo<SectionOption>(
    () => ({ id: ALL_SECTIONS_ID, label: allLabel }),
    [allLabel],
  );
  const [chosen, setChosen] = React.useState<SectionOption | null>(null);
  const selected =
    value === ALL_SECTIONS_ID
      ? allOption
      : chosen?.id === value
        ? chosen
        : { id: value, label: value };

  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SectionOption[]>([]);
  const [nextToken, setNextToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const timer = setTimeout(
      () => setQuery(typed.trim()),
      typed === "" ? 0 : SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [typed]);

  const load = React.useCallback(
    async (q: string, token: string | null) => {
      const id = ++requestId.current;
      setLoading(true);
      setFailed(false);
      try {
        const page = await searchSectionPage({
          list: listSections,
          query: q,
          nextToken: token,
        });
        if (id !== requestId.current) return;
        setResults((prev) => {
          if (!token) return page.options;
          const seen = new Set(prev.map((o) => o.id));
          return [...prev, ...page.options.filter((o) => !seen.has(o.id))];
        });
        setNextToken(page.nextToken);
      } catch (err) {
        if (id !== requestId.current) return;
        console.warn("[AdminSectionSelect] Failed to load sections:", err);
        setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [listSections],
  );

  React.useEffect(() => {
    if (open) void load(query, null);
  }, [open, query, load]);

  const loadMore = React.useCallback(() => {
    if (nextToken && !loading) void load(query, nextToken);
  }, [nextToken, loading, query, load]);

  // Only admins may see every instructor's sections; instructors get hits
  // from their own bundle so other instructors' section names never appear.
  const { session } = React.useContext(AuthContext) as unknown as {
    session?: { groups?: string[] };
  };
  const { hits: semanticHits } = useAdminSemanticSearch(typed, "section", {
    enabled: open,
    scope: session?.groups?.includes("Admins") ? "platform" : "own",
  });

  // Semantic matches from the search index appear instantly (no page scan) and
  // rank first. Everything else is narrowed from the paged scan results, which
  // also covers sections newer than the index.
  const options = React.useMemo(() => {
    const needle = typed.trim();
    const labelById = new Map(results.map((o) => [o.id, o]));
    const semantic: SectionOption[] = (semanticHits ?? []).map(
      (hit) => labelById.get(hit.id) ?? { id: hit.id, label: hit.title },
    );
    const semanticIds = new Set(semantic.map((o) => o.id));
    const lexical = results.filter(
      (o) =>
        !semanticIds.has(o.id) &&
        matchesQuery({ name: o.label, code: o.code }, needle),
    );
    const showAll = !needle || allLabel.toLowerCase().includes(needle.toLowerCase());
    return [...(showAll ? [allOption] : []), ...semantic, ...lexical];
  }, [typed, allLabel, allOption, results, semanticHits]);

  const footer =
    failed || nextToken ? (
      <Box sx={{ display: "flex", justifyContent: "center", p: 0.5 }}>
        <Button
          size="small"
          disabled={loading}
          // Keep focus in the input so the popup does not close.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (failed && !nextToken ? void load(query, null) : loadMore())}
        >
          {failed ? "Retry" : "Load more sections"}
        </Button>
      </Box>
    ) : null;

  return (
    <Autocomplete<SectionOption, false, true>
      size="small"
      disableClearable
      autoHighlight
      selectOnFocus
      openOnFocus
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setTyped("");
      }}
      loading={loading}
      options={options}
      value={selected}
      onInputChange={(_, next, reason) => {
        if (reason === "input") setTyped(next);
      }}
      onChange={(_, option) => {
        setChosen(option);
        onChange(option.id);
      }}
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText="No sections found"
      loadingText="Searching sections…"
      slots={{ paper: FooterPaper }}
      slotProps={{
        paper: { footer } as PaperProps,
        listbox: {
          onScroll: (event: React.UIEvent<HTMLElement>) => {
            const el = event.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
              loadMore();
            }
          },
        },
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <li key={key} {...rest}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {option.label}
              </Typography>
              {option.code && (
                <Typography variant="caption" color="text.secondary">
                  {option.code}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      sx={{ minWidth }}
    />
  );
}
