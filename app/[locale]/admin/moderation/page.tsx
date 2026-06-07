"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { getAmplifyClient } from "@/utils/amplifyClient";

interface FlaggedItem {
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

export default function ModerationDashboardPage() {
  const [items, setItems] = React.useState<FlaggedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modelFilter, setModelFilter] = React.useState<ModelFilter>("all");

  React.useEffect(() => {
    loadFlaggedItems();
  }, []);

  async function loadFlaggedItems() {
    setLoading(true);
    const client = getAmplifyClient() as any;

    const models: Array<{
      name: string;
      model: any;
      getSectionId?: (item: any) => string | null;
    }> = [
      { name: "Grade", model: client.models.Grade },
      { name: "Unit", model: client.models.Unit },
      { name: "Word", model: client.models.Word },
      { name: "Question", model: client.models.Question },
    ];

    const allFlagged: FlaggedItem[] = [];

    for (const { name, model } of models) {
      try {
        // Query items that have moderation status set to flagged
        const { data } = await model.list({
          filter: {
            moderationStatus: { eq: "flagged" },
          },
          limit: 100,
        });

        for (const item of data || []) {
          if (!item) continue;
          allFlagged.push({
            id: item.id,
            modelName: name,
            owner: item.owner || item.ownerId || null,
            moderation: item.moderation || {
              status: item.moderationStatus,
              flags: item.moderationFlags,
              checkedAt: item.moderationCheckedAt,
            },
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            sectionId: item.sectionID || null,
          });
        }
      } catch (err) {
        console.warn(`[Moderation] Failed to load flagged ${name}s:`, err);
      }
    }

    // Sort by most recent first
    allFlagged.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    setItems(allFlagged);
    setLoading(false);
  }

  const filteredItems =
    modelFilter === "all"
      ? items
      : items.filter((i) => i.modelName === modelFilter);

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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Content Type</InputLabel>
            <Select
              value={modelFilter}
              label="Content Type"
              onChange={(e) =>
                setModelFilter(e.target.value as ModelFilter)
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="Grade">Grades</MenuItem>
              <MenuItem value="Unit">Units</MenuItem>
              <MenuItem value="Word">Words</MenuItem>
              <MenuItem value="Question">Questions</MenuItem>
            </Select>
          </FormControl>

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
                            item.modelName === "Grade"
                              ? "error"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.owner || "Unknown"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
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
