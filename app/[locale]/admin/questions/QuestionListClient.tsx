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
import ConfirmDialog from "@/components/ConfirmDialog";

// ============================================================================
// Types
// ============================================================================

interface QuestionRecord {
  id: string;
  prompt: string | null;
  answer: string | null;
  hint: string | null;
  choices: unknown;
  audio: string[] | null;
  answerAudio: string[] | null;
  generated: boolean | null;
  model: string | null;
  difficulty: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  moderation?: { status?: string; flags?: string; checkedAt?: string } | null;
  embedding?: { model?: string } | null;
}

interface QuestionHealthStats {
  total: number;
  missingAudio: number;
  missingAnswer: number;
  missingEmbedding: number;
  flagged: number;
  generated: number;
  manual: number;
}

type FilterMode =
  | "all"
  | "missing_audio"
  | "missing_answer"
  | "missing_embedding"
  | "flagged"
  | "generated"
  | "manual";

// `choices` is an a.json() field — normally comes back already parsed, but
// handle a raw JSON string defensively since other json fields in this repo
// are stored pre-stringified.
function hasChoices(choices: unknown): boolean {
  const parsed =
    typeof choices === "string"
      ? (() => {
          try {
            return JSON.parse(choices);
          } catch {
            return null;
          }
        })()
      : choices;
  return Array.isArray(parsed) && parsed.length > 0;
}

// ============================================================================
// Main Page
// ============================================================================

export default function QuestionListClient({
  initialQuestions,
}: {
  initialQuestions: QuestionRecord[];
}) {
  const [questions, setQuestions] =
    React.useState<QuestionRecord[]>(initialQuestions);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<QuestionHealthStats | null>(() =>
    computeStats(initialQuestions),
  );
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  async function loadQuestions() {
    setLoading(true);
    const client = getAmplifyClient() as any;

    try {
      const allQuestions: QuestionRecord[] = [];
      let nextToken: string | null = null;

      do {
        const {
          data,
          nextToken: token,
        }: { data: any; nextToken: string | null } =
          await client.models.Question.list({
            limit: 500,
            nextToken,
            selectionSet: [
              "id",
              "prompt",
              "answer",
              "hint",
              "choices",
              "audio",
              "answerAudio",
              "generated",
              "model",
              "difficulty",
              "owner",
              "createdAt",
              "updatedAt",
              "moderation.*",
              "embedding.*",
            ],
          });
        for (const item of data || []) {
          if (item) allQuestions.push(item);
        }
        nextToken = token || null;
      } while (nextToken);

      setQuestions(allQuestions);
      setStats(computeStats(allQuestions));
    } catch (err) {
      console.error("[QuestionMaintenance] Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(list: QuestionRecord[]): QuestionHealthStats {
    let missingAudio = 0;
    let missingAnswer = 0;
    let missingEmbedding = 0;
    let flagged = 0;
    let generated = 0;
    let manual = 0;

    for (const q of list) {
      if (!q.audio || q.audio.length === 0) missingAudio++;
      if (!(q.answer || "").trim() && !hasChoices(q.choices)) missingAnswer++;
      if (!q.embedding?.model) missingEmbedding++;
      if (q.moderation?.status === "flagged") flagged++;
      if (q.generated) generated++;
      else manual++;
    }

    return {
      total: list.length,
      missingAudio,
      missingAnswer,
      missingEmbedding,
      flagged,
      generated,
      manual,
    };
  }

  const filteredQuestions = React.useMemo(() => {
    let result = questions;

    switch (filter) {
      case "missing_audio":
        result = result.filter((q) => !q.audio || q.audio.length === 0);
        break;
      case "missing_answer":
        result = result.filter(
          (q) => !(q.answer || "").trim() && !hasChoices(q.choices),
        );
        break;
      case "missing_embedding":
        result = result.filter((q) => !q.embedding?.model);
        break;
      case "flagged":
        result = result.filter((q) => q.moderation?.status === "flagged");
        break;
      case "generated":
        result = result.filter((q) => !!q.generated);
        break;
      case "manual":
        result = result.filter((q) => !q.generated);
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          (item.prompt || "").toLowerCase().includes(q) ||
          (item.answer || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [questions, filter, searchQuery]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredQuestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredQuestions.map((q) => q.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setConfirmDeleteOpen(false);

    setDeleting(true);
    const client = getAmplifyClient() as any;
    const ids = [...selected];

    for (const id of ids) {
      try {
        await client.models.Question.delete({ id });
      } catch (err) {
        console.warn(`[QuestionMaintenance] Failed to delete ${id}:`, err);
      }
    }

    setSelected(new Set());
    setDeleting(false);

    await loadQuestions();
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminRouteGuard>
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Question Bank Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage question health: find questions missing audio, an
          answer/choices, or embeddings, and separate AI-generated from manual
          content.
        </Typography>

        {/* Stats Cards */}
        {loading ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[...Array(7)].map((_, i) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
                <Skeleton variant="rounded" height={80} />
              </Grid>
            ))}
          </Grid>
        ) : stats ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Total Questions"
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
                label="No Answer/Choices"
                value={stats.missingAnswer}
                color="warning"
                onClick={() => setFilter("missing_answer")}
                active={filter === "missing_answer"}
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
                label="AI Generated"
                value={stats.generated}
                onClick={() => setFilter("generated")}
                active={filter === "generated"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Manual"
                value={stats.manual}
                onClick={() => setFilter("manual")}
                active={filter === "manual"}
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
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              },
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
              <MenuItem value="all">All Questions</MenuItem>
              <MenuItem value="missing_audio">Missing Audio</MenuItem>
              <MenuItem value="missing_answer">No Answer/Choices</MenuItem>
              <MenuItem value="missing_embedding">Missing Embedding</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="generated">AI Generated</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {filteredQuestions.length} question
            {filteredQuestions.length !== 1 ? "s" : ""}
          </Typography>

          <Box sx={{ flex: 1 }} />

          {selected.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
            >
              Delete {selected.size} selected
            </Button>
          )}

          <Tooltip title="Refresh">
            <IconButton onClick={loadQuestions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {deleting && <LinearProgress sx={{ mb: 1 }} />}

        {/* Question Table */}
        {loading ? (
          <Box>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                {filter === "all"
                  ? "No questions found."
                  : "No questions match this filter. All clear!"}
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
                        selected.size < filteredQuestions.length
                      }
                      checked={selected.size === filteredQuestions.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Prompt</TableCell>
                  <TableCell>Answer</TableCell>
                  <TableCell align="center">Audio</TableCell>
                  <TableCell align="center">Embedding</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.slice(0, 200).map((question) => (
                  <TableRow
                    key={question.id}
                    hover
                    selected={selected.has(question.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(question.id)}
                        onChange={() => toggleSelect(question.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        noWrap
                        sx={{ maxWidth: 260 }}
                      >
                        {question.prompt || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {question.answer ||
                          (hasChoices(question.choices) ? (
                            <Chip
                              label="Choices"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              label="Missing"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ))}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {question.audio && question.audio.length > 0 ? (
                        <VolumeUpIcon fontSize="small" color="success" />
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
                      {question.embedding?.model ? (
                        <Chip
                          label="✓"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="—" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={question.generated ? "Generated" : "Manual"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ maxWidth: 120, display: "block" }}
                      >
                        {question.owner
                          ? question.owner.slice(0, 12) + "..."
                          : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {question.moderation?.status === "flagged" ? (
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

        {filteredQuestions.length > 200 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Showing first 200 of {filteredQuestions.length} questions. Use
            search or filters to narrow results.
          </Alert>
        )}
      </Box>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Questions"
        message={`Delete ${selected.size} question(s)? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
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
