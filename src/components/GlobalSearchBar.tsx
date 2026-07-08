import React from "react";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuizIcon from "@mui/icons-material/Quiz";
import SchoolIcon from "@mui/icons-material/School";
import ChatIcon from "@mui/icons-material/Chat";
import SectionContext from "../context/sectionContext";
import { getAmplifyClient } from "../utils/amplifyClient";
import { listSectionStudents } from "../../app/actions/section";
import { useSearch, type SearchResult } from "../context/searchContext";
import { usePathname, useRouter } from "next/navigation";

interface FilterOption {
  label: string;
  value: string;
}

const TYPE_OPTIONS: FilterOption[] = [
  { label: "file", value: "type:file" },
  { label: "unit", value: "type:unit" },
  { label: "word", value: "type:word" },
  { label: "question", value: "type:question" },
  { label: "section", value: "type:section" },
  { label: "chat", value: "type:chat" },
];

const FROM_BASE_OPTIONS: FilterOption[] = [
  { label: "user", value: "from:user" },
  { label: "assistant", value: "from:assistant" },
];

const typeIcons: Record<string, React.ReactNode> = {
  unit: <SchoolIcon fontSize="small" />,
  file: <DescriptionIcon fontSize="small" />,
  word: <MenuBookIcon fontSize="small" />,
  question: <QuizIcon fontSize="small" />,
  chat: <ChatIcon fontSize="small" />,
};

const typeLabels: Record<string, string> = {
  unit: "UNITS",
  file: "FILES",
  word: "VOCABULARY",
  question: "QUESTIONS",
  section: "SECTIONS",
  chat: "CHAT",
};

function groupResults(
  results: SearchResult[],
): Record<string, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};
  for (const result of results) {
    if (!grouped[result.type]) grouped[result.type] = [];
    grouped[result.type].push(result);
  }
  return grouped;
}

function stripOperator(query: string, operator: "type" | "from"): string {
  return query
    .trim()
    .split(/\s+/)
    .filter((token) => !token.toLowerCase().startsWith(`${operator}:`))
    .join(" ")
    .trim();
}

function upsertOperator(
  query: string,
  operator: "type" | "from",
  value: string,
): string {
  const stripped = stripOperator(query, operator);
  return `${value}${stripped ? ` ${stripped}` : ""}`.trim();
}

function findOperatorValue(
  query: string,
  operator: "type" | "from",
): string | null {
  const token = query
    .trim()
    .split(/\s+/)
    .find((t) => t.toLowerCase().startsWith(`${operator}:`));
  return token || null;
}

export default function GlobalSearchBar() {
  const {
    query,
    results,
    searching,
    open,
    setQuery,
    clearSearch,
    setOpen,
    executeSearch,
  } = useSearch();
  const router = useRouter();
  const pathname = usePathname();
  const sectionCtx = React.useContext(SectionContext as React.Context<any>);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = React.useState(-1);
  const [fromOptions, setFromOptions] = React.useState<FilterOption[]>(
    FROM_BASE_OPTIONS,
  );
  const [fromLoading, setFromLoading] = React.useState(false);

  const grouped = React.useMemo(() => groupResults(results), [results]);
  const flatResults = results;
  const shouldShowFallbackSearch =
    open && query.trim().length >= 2 && !searching && results.length === 0;
  const selectedType = React.useMemo(
    () => findOperatorValue(query, "type"),
    [query],
  );
  const selectedFrom = React.useMemo(
    () => findOperatorValue(query, "from"),
    [query],
  );
  const selectedTypeOption = React.useMemo(
    () => TYPE_OPTIONS.find((opt) => opt.value === selectedType) || null,
    [selectedType],
  );
  const selectedFromOption = React.useMemo(
    () => fromOptions.find((opt) => opt.value === selectedFrom) || null,
    [fromOptions, selectedFrom],
  );
  const currentSectionId = React.useMemo(() => {
    const match = pathname?.match(/\/section\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);
  const hasActiveFilters = Boolean(selectedTypeOption || selectedFromOption);

  React.useEffect(() => {
    setFocusIndex(-1);
  }, [query, results.length]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSectionUsers() {
      if (!open || !currentSectionId) {
        setFromOptions(FROM_BASE_OPTIONS);
        return;
      }

      setFromLoading(true);
      try {
        const sectionMap = sectionCtx?.sectionMap || {};
        const sections = sectionCtx?.sections || [];
        let sectionCode = sectionMap[currentSectionId]?.code;

        if (!sectionCode) {
          const fromList = sections.find((s: any) => s.id === currentSectionId);
          sectionCode = fromList?.code;
        }

        if (!sectionCode) {
          const client = getAmplifyClient();
          const section = await client.models.Section.get({ id: currentSectionId });
          sectionCode = section?.data?.code;
        }

        if (!sectionCode || cancelled) {
          setFromOptions(FROM_BASE_OPTIONS);
          return;
        }

        const response = await listSectionStudents(sectionCode);
        if (!response?.success || !Array.isArray(response.students) || cancelled) {
          setFromOptions(FROM_BASE_OPTIONS);
          return;
        }

        const dynamic = response.students
          .map((student) => {
            const identity =
              student.email ||
              student.preferredName ||
              student.name ||
              student.id;
            if (!identity) return null;

            const displayName =
              student.preferredName ||
              [student.firstName, student.lastName].filter(Boolean).join(" ") ||
              student.name ||
              student.email ||
              student.id;

            return {
              label: displayName,
              value: `from:${identity}`,
            } as FilterOption;
          })
          .filter((value): value is FilterOption => value != null);

        const dedup = new Map<string, FilterOption>();
        [...FROM_BASE_OPTIONS, ...dynamic].forEach((item) => {
          dedup.set(item.value.toLowerCase(), item);
        });

        setFromOptions(Array.from(dedup.values()));
      } catch {
        if (!cancelled) {
          setFromOptions(FROM_BASE_OPTIONS);
        }
      } finally {
        if (!cancelled) {
          setFromLoading(false);
        }
      }
    }

    loadSectionUsers();
    return () => {
      cancelled = true;
    };
  }, [open, currentSectionId, sectionCtx?.sectionMap, sectionCtx?.sections]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusIndex >= 0) {
        navigateToResult(flatResults[focusIndex]);
      } else if (query.trim().length >= 2) {
        void executeSearch(query);
        setOpen(true);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setOpen(false);
    const q = encodeURIComponent(query);
    switch (result.type) {
      case "unit":
        router.push(`/units?q=${q}&id=${result.id}`);
        break;
      case "file":
        router.push(`/files?q=${q}&id=${result.id}`);
        break;
      case "word":
        router.push(`/dictionary?q=${q}&id=${result.id}`);
        break;
      case "question":
        router.push(`/dictionary?q=${q}&tab=questions&id=${result.id}`);
        break;
      default:
        router.push(`/?q=${q}`);
    }
  };

  return (
    <Box ref={anchorRef} sx={{ position: "relative", mx: 1, flexGrow: 1, maxWidth: 400 }}>
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.25,
          borderRadius: 2,
          bgcolor: "action.hover",
        }}
        elevation={0}
      >
        <SearchIcon sx={{ color: "text.secondary", mr: 0.5 }} fontSize="small" />
        <InputBase
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          sx={{ flex: 1, fontSize: "0.875rem" }}
          inputProps={{ "aria-label": "global search" }}
        />
        {searching && <CircularProgress size={16} sx={{ mr: 0.5 }} />}
        {query && (
          <IconButton size="small" onClick={clearSearch}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      <Popper
        open={open && (results.length > 0 || shouldShowFallbackSearch)}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 3,
          width: anchorRef.current?.offsetWidth || 400,
        }}
      >
        <Paper elevation={4} sx={{ maxHeight: 400, overflow: "auto", mt: 0.5 }}>
          <Box sx={{ px: 1, pt: 1, pb: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Autocomplete
                size="small"
                options={TYPE_OPTIONS}
                value={selectedTypeOption}
                onMouseDown={(e) => e.preventDefault()}
                onChange={(_, option) => {
                  const updated = option
                    ? upsertOperator(query, "type", option.value)
                    : stripOperator(query, "type");
                  setQuery(updated);
                  setOpen(true);
                }}
                getOptionLabel={(option) => option.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Type"
                    placeholder="type:..."
                    size="small"
                  />
                )}
                sx={{ minWidth: 165, flex: 1 }}
              />
              <Autocomplete
                size="small"
                options={fromOptions}
                loading={fromLoading}
                value={selectedFromOption}
                onMouseDown={(e) => e.preventDefault()}
                onChange={(_, option) => {
                  const updated = option
                    ? upsertOperator(query, "from", option.value)
                    : stripOperator(query, "from");
                  setQuery(updated);
                  setOpen(true);
                }}
                getOptionLabel={(option) => `${option.value} (${option.label})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="From"
                    placeholder="from:..."
                    size="small"
                  />
                )}
                sx={{ minWidth: 190, flex: 1 }}
              />
            </Stack>
            {hasActiveFilters && (
              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 0.75, alignItems: "center" }}
              >
                {selectedTypeOption && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Type: ${selectedTypeOption.label}`}
                    onDelete={() => {
                      setQuery(stripOperator(query, "type"));
                      setOpen(true);
                    }}
                  />
                )}
                {selectedFromOption && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`From: ${selectedFromOption.label}`}
                    onDelete={() => {
                      setQuery(stripOperator(query, "from"));
                      setOpen(true);
                    }}
                  />
                )}
                <Button
                  size="small"
                  onClick={() => {
                    const noType = stripOperator(query, "type");
                    const noFrom = stripOperator(noType, "from");
                    setQuery(noFrom);
                    setOpen(true);
                  }}
                  sx={{ minWidth: "auto", px: 0.75, textTransform: "none" }}
                >
                  Clear filters
                </Button>
              </Stack>
            )}
          </Box>
          <List dense>
            {Object.entries(grouped).map(([type, items]) => (
              <React.Fragment key={type}>
                <ListSubheader sx={{ lineHeight: "28px", fontSize: "0.7rem" }}>
                  {typeLabels[type] || type.toUpperCase()}
                </ListSubheader>
                {items.map((result, idx) => {
                  const globalIdx = flatResults.indexOf(result);
                  return (
                    <ListItemButton
                      key={result.id}
                      onClick={() => navigateToResult(result)}
                      selected={globalIdx === focusIndex}
                      sx={{ pl: 3 }}
                    >
                      <Box sx={{ mr: 1, color: "text.secondary" }}>
                        {typeIcons[result.type]}
                      </Box>
                      <ListItemText
                        primary={result.title}
                        secondary={result.description}
                        primaryTypographyProps={{ noWrap: true, fontSize: "0.85rem" }}
                        secondaryTypographyProps={{ noWrap: true, fontSize: "0.75rem" }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {result.score.toFixed(2)}
                      </Typography>
                    </ListItemButton>
                  );
                })}
              </React.Fragment>
            ))}
            {shouldShowFallbackSearch && (
              <>
                <ListSubheader sx={{ lineHeight: "28px", fontSize: "0.7rem" }}>
                  NO RESULTS
                </ListSubheader>
                <ListItemButton disabled sx={{ pl: 3, opacity: 0.8 }}>
                  <Box sx={{ mr: 1, color: "text.secondary" }}>
                    <SearchIcon fontSize="small" />
                  </Box>
                  <ListItemText
                    primary={`No matches for "${query.trim()}"`}
                    primaryTypographyProps={{ noWrap: true, fontSize: "0.85rem" }}
                  />
                </ListItemButton>
              </>
            )}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
}
