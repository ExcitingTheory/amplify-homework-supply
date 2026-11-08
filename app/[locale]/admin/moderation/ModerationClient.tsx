"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import AdminSelect from "../_components/AdminSelect";
import {
  mergeSearchResults,
  useAdminSemanticSearch,
} from "../_components/adminSemanticSearch";

export interface FlaggedItem {
  id: string;
  modelName: string;
  owner: string | null;
  moderation: {
    status: string;
    flags: string | null;
    checkedAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  sectionId?: string | null;
}

type ModelFilter = "all" | "Grade" | "Unit" | "Word" | "Question";

const MODEL_FILTER_OPTIONS: { value: ModelFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "Grade", label: "Grades" },
  { value: "Unit", label: "Units" },
  { value: "Word", label: "Words" },
  { value: "Question", label: "Questions" },
];

function getFlaggedCategories(item: FlaggedItem): string[] {
  try {
    const flags = item.moderation?.flags;
    if (!flags) return [];
    const parsed = JSON.parse(flags);
    return Object.entries(parsed.categories || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  } catch {
    return [];
  }
}

export default function ModerationClient({
  initialItems,
}: {
  initialItems: FlaggedItem[];
}) {
  const [items] = React.useState<FlaggedItem[]>(initialItems);
  const [loading] = React.useState(false);
  const [modelFilter, setModelFilter] = React.useState<ModelFilter>("all");

  const [searchQuery, setSearchQuery] = React.useState("");

  // Grades have no search-bundle entries; semantic hits only apply to the rest.
  const { hits: semanticHits, searching: semanticSearching } =
    useAdminSemanticSearch(searchQuery, ["unit", "word", "question"]);

  const filteredItems = React.useMemo(() => {
    const byType =
      modelFilter === "all"
        ? items
        : items.filter((i) => i.modelName === modelFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byType;
    return mergeSearchResults(byType, semanticHits, (item) =>
      [
        item.id,
        item.owner,
        item.modelName,
        ...getFlaggedCategories(item),
      ].some((field) => (field || "").toLowerCase().includes(q)),
    );
  }, [items, modelFilter, searchQuery, semanticHits]);

  function getReviewLink(item: FlaggedItem): string {
    switch (item.modelName) {
      case "Grade":
        return `/instructor/grade/${item.id}`;
      case "Unit":
        return `/units/${item.id}`;
      default:
        return "#";
    }
  }

  return (
    <AdminRouteGuard>
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 3,
          }}
        >
          <WarningAmberIcon color="warning" />
          <Typography variant="h4" component="h1">
            Content Moderation
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <AdminSelect
            label="Content Type"
            value={modelFilter}
            options={MODEL_FILTER_OPTIONS}
            onChange={setModelFilter}
            minWidth={160}
          />

          <TextField
            size="small"
            placeholder="Search flagged content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
                endAdornment: semanticSearching ? (
                  <CircularProgress size={16} aria-label="Searching" />
                ) : undefined,
              },
            }}
            sx={{ minWidth: 240 }}
          />

          <Typography variant="body2" color="text.secondary">
            {filteredItems.length} flagged item
            {filteredItems.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                No flagged content found. All clear!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Flagged Categories</TableCell>
                  <TableCell>Checked At</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const categories = getFlaggedCategories(item);
                  return (
                    <TableRow key={`${item.modelName}-${item.id}`}>
                      <TableCell>
                        <Chip
                          label={item.modelName}
                          size="small"
                          color={
                            item.modelName === "Grade" ? "error" : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {item.owner || "Unknown"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {categories.map((cat) => (
                            <Chip
                              key={cat}
                              label={cat.replace(/[/_]/g, " ")}
                              size="small"
                              color="error"
                            />
                          ))}
                          {categories.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.moderation?.checkedAt
                            ? new Date(
                                item.moderation.checkedAt,
                              ).toLocaleDateString()
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={getReviewLink(item)}
                          underline="hover"
                          color="primary"
                        >
                          Review
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </AdminRouteGuard>
  );
}
