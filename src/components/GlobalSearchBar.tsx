import React from "react";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import List from "@mui/material/List";
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
import { useSearch, type SearchResult } from "../context/searchContext";
import { useRouter } from "next/navigation";

const typeIcons: Record<string, React.ReactNode> = {
  unit: <SchoolIcon fontSize="small" />,
  file: <DescriptionIcon fontSize="small" />,
  word: <MenuBookIcon fontSize="small" />,
  question: <QuizIcon fontSize="small" />,
};

const typeLabels: Record<string, string> = {
  unit: "UNITS",
  file: "FILES",
  word: "VOCABULARY",
  question: "QUESTIONS",
  section: "SECTIONS",
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

export default function GlobalSearchBar() {
  const { query, results, searching, open, setQuery, clearSearch, setOpen } =
    useSearch();
  const router = useRouter();
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = React.useState(-1);

  const grouped = React.useMemo(() => groupResults(results), [results]);
  const flatResults = results;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault();
      navigateToResult(flatResults[focusIndex]);
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
        open={open && results.length > 0}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1300, width: anchorRef.current?.offsetWidth || 400 }}
      >
        <Paper elevation={4} sx={{ maxHeight: 400, overflow: "auto", mt: 0.5 }}>
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
          </List>
        </Paper>
      </Popper>
    </Box>
  );
}
