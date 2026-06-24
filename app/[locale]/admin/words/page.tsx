"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import DeleteIcon from "@mui/icons-material/Delete";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { getAmplifyClient } from "@/utils/amplifyClient";

// ============================================================================
// Types
// ============================================================================

interface WordRecord {
  id: string;
  phrase: string | null;
  pronunciation: string | null;
  definition: string | null;
  audio: string[] | null;
  definitionAudio: string[] | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  moderation?: { status?: string; flags?: string; checkedAt?: string } | null;
  embedding?: { model?: string } | null;
}

interface WordHealthStats {
  total: number;
  missingAudio: number;
  missingDefinition: number;
  missingPronunciation: number;
  missingEmbedding: number;
  flagged: number;
  duplicates: number;
}

type FilterMode =
  | "all"
  | "missing_audio"
  | "missing_definition"
  | "missing_pronunciation"
  | "missing_embedding"
  | "flagged"
  | "duplicates";

// ============================================================================
// Main Page
// ============================================================================

export default function WordListMaintenancePage() {
  const [words, setWords] = React.useState<WordRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<WordHealthStats | null>(null);
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    setLoading(true);
    const client = getAmplifyClient() as any;

    try {
      const allWords: WordRecord[] = [];
      let nextToken: string | null = null;

      do {
        const { data, nextToken: token }: { data: any; nextToken: string | null } = await client.models.Word.list({
          limit: 500,
          nextToken,
          selectionSet: [
            "id",
            "phrase",
            "pronunciation",
            "definition",
            "audio",
            "definitionAudio",
            "owner",
            "createdAt",
            "updatedAt",
            "moderation.*",
            "embedding.*",
          ],
        });
        for (const item of data || []) {
          if (item) allWords.push(item);
        }
        nextToken = token || null;
      } while (nextToken);

      setWords(allWords);
      computeStats(allWords);
    } catch (err) {
      console.error("[WordMaintenance] Failed to load words:", err);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(wordList: WordRecord[]) {
    const phraseCount = new Map<string, number>();
    let missingAudio = 0;
    let missingDefinition = 0;
    let missingPronunciation = 0;
    let missingEmbedding = 0;
    let flagged = 0;

    for (const w of wordList) {
      // Count phrases for duplicate detection
      const key = (w.phrase || "").toLowerCase().trim();
      if (key) phraseCount.set(key, (phraseCount.get(key) || 0) + 1);

      if (!w.audio || w.audio.length === 0) missingAudio++;
      if (!w.definition || w.definition.trim() === "") missingDefinition++;
      if (!w.pronunciation || w.pronunciation.trim() === "")
        missingPronunciation++;
      if (!w.embedding?.model) missingEmbedding++;
      if (w.moderation?.status === "flagged") flagged++;
    }

    const duplicates = [...phraseCount.values()].filter((c) => c > 1).length;

    setStats({
      total: wordList.length,
      missingAudio,
      missingDefinition,
      missingPronunciation,
      missingEmbedding,
      flagged,
      duplicates,
    });
  }

  const filteredWords = React.useMemo(() => {
    let result = words;

    switch (filter) {
      case "missing_audio":
        result = result.filter((w) => !w.audio || w.audio.length === 0);
        break;
      case "missing_definition":
        result = result.filter(
          (w) => !w.definition || w.definition.trim() === "",
        );
        break;
      case "missing_pronunciation":
        result = result.filter(
          (w) => !w.pronunciation || w.pronunciation.trim() === "",
        );
        break;
      case "missing_embedding":
        result = result.filter((w) => !w.embedding?.model);
        break;
      case "flagged":
        result = result.filter((w) => w.moderation?.status === "flagged");
        break;
      case "duplicates": {
        const phraseCount = new Map<string, number>();
        for (const w of words) {
          const key = (w.phrase || "").toLowerCase().trim();
          if (key) phraseCount.set(key, (phraseCount.get(key) || 0) + 1);
        }
        result = result.filter((w) => {
          const key = (w.phrase || "").toLowerCase().trim();
          return phraseCount.get(key)! > 1;
        });
        break;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          (w.phrase || "").toLowerCase().includes(q) ||
          (w.definition || "").toLowerCase().includes(q) ||
          (w.pronunciation || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [words, filter, searchQuery]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredWords.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredWords.map((w) => w.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.size} word(s)? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    const client = getAmplifyClient() as any;
    const ids = [...selected];
    let deleted = 0;

    for (const id of ids) {
      try {
        const word = words.find((w) => w.id === id);
        await client.models.Word.delete({ id });
        deleted++;
      } catch (err) {
        console.warn(`[WordMaintenance] Failed to delete ${id}:`, err);
      }
    }

    setSelected(new Set());
    setDeleting(false);

    // Reload
    await loadWords();
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminRouteGuard>
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Word List Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage vocabulary health: find words missing audio, definitions,
          embeddings, or flagged by moderation.
        </Typography>

        {/* Stats Cards */}
        {loading ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
                <Skeleton variant="rounded" height={80} />
              </Grid>
            ))}
          </Grid>
        ) : stats ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Total Words"
                value={stats.total}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Missing Audio"
                value={stats.missingAudio}
                color="warning"
                onClick={() => setFilter("missing_audio")}
                active={filter === "missing_audio"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Missing Definition"
                value={stats.missingDefinition}
                color="warning"
                onClick={() => setFilter("missing_definition")}
                active={filter === "missing_definition"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="No Pronunciation"
                value={stats.missingPronunciation}
                color="info"
                onClick={() => setFilter("missing_pronunciation")}
                active={filter === "missing_pronunciation"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="No Embedding"
                value={stats.missingEmbedding}
                color="info"
                onClick={() => setFilter("missing_embedding")}
                active={filter === "missing_embedding"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Flagged"
                value={stats.flagged}
                color="error"
                onClick={() => setFilter("flagged")}
                active={filter === "flagged"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Duplicates"
                value={stats.duplicates}
                color="warning"
                onClick={() => setFilter("duplicates")}
                active={filter === "duplicates"}
              />
            </Grid>
          </Grid>
        ) : null}

        {/* Toolbar */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> },
            }}
            sx={{ minWidth: 240 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value as FilterMode)}
            >
              <MenuItem value="all">All Words</MenuItem>
              <MenuItem value="missing_audio">Missing Audio</MenuItem>
              <MenuItem value="missing_definition">Missing Definition</MenuItem>
              <MenuItem value="missing_pronunciation">
                Missing Pronunciation
              </MenuItem>
              <MenuItem value="missing_embedding">Missing Embedding</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="duplicates">Duplicates</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {filteredWords.length} word{filteredWords.length !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {selected.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              Delete {selected.size} selected
            </Button>
          )}

          <Tooltip title="Refresh">
            <IconButton onClick={loadWords} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {deleting && <LinearProgress sx={{ mb: 1 }} />}

        {/* Word Table */}
        {loading ? (
          <Box>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        ) : filteredWords.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                {filter === "all"
                  ? "No words found."
                  : "No words match this filter. All clear!"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.size > 0 &&
                        selected.size < filteredWords.length
                      }
                      checked={selected.size === filteredWords.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Phrase</TableCell>
                  <TableCell>Pronunciation</TableCell>
                  <TableCell>Definition</TableCell>
                  <TableCell align="center">Audio</TableCell>
                  <TableCell align="center">Embedding</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWords.slice(0, 200).map((word) => (
                  <TableRow
                    key={word.id}
                    hover
                    selected={selected.has(word.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(word.id)}
                        onChange={() => toggleSelect(word.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        noWrap
                        sx={{ maxWidth: 200 }}
                      >
                        {word.phrase || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 150 }}
                      >
                        {word.pronunciation || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: 250 }}
                      >
                        {word.definition || (
                          <Chip
                            label="Missing"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {word.audio && word.audio.length > 0 ? (
                        <VolumeUpIcon
                          fontSize="small"
                          color="success"
                        />
                      ) : (
                        <Chip
                          label="None"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {word.embedding?.model ? (
                        <Chip
                          label="✓"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="—"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ maxWidth: 120, display: "block" }}
                      >
                        {word.owner
                          ? word.owner.slice(0, 12) + "..."
                          : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {word.moderation?.status === "flagged" ? (
                        <Chip
                          icon={<WarningAmberIcon />}
                          label="Flagged"
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Chip
                          label="OK"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredWords.length > 200 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Showing first 200 of {filteredWords.length} words. Use search or
            filters to narrow results.
          </Alert>
        )}
      </Box>
    </AdminRouteGuard>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
  label,
  value,
  color = "default",
  onClick,
  active,
}: {
  label: string;
  value: number;
  color?: "default" | "warning" | "error" | "info" | "success";
  onClick: () => void;
  active: boolean;
}) {
  const colorMap: Record<string, string> = {
    default: "text.primary",
    warning: "warning.main",
    error: "error.main",
    info: "info.main",
    success: "success.main",
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        border: active ? 2 : 1,
        borderColor: active ? "primary.main" : "divider",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="h5" color={colorMap[color]} fontWeight={600}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
