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
import ImageIcon from "@mui/icons-material/Image";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { getAmplifyClient } from "@/utils/amplifyClient";
import ConfirmDialog from "@/components/ConfirmDialog";

// ============================================================================
// Types
// ============================================================================

interface FileRecord {
  id: string;
  name: string | null;
  description: string | null;
  mimeType: string | null;
  path: string | null;
  size: number | null;
  thumbnail: string | null;
  generated: boolean | null;
  documentID: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  moderation?: { status?: string; flags?: string; checkedAt?: string } | null;
  embedding?: { model?: string } | null;
  // Computed server-side from the File join tables — true when nothing (unit,
  // word, question, chat, document) references this file.
  orphaned: boolean;
}

interface FileHealthStats {
  total: number;
  orphaned: number;
  missingThumbnail: number;
  large: number;
  flagged: number;
  generated: number;
}

type FilterMode =
  "all" | "orphaned" | "missing_thumbnail" | "large" | "flagged" | "generated";

// Above this, a file is called out as unusually large (bytes).
const LARGE_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !(bytes > 0)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// ============================================================================
// Main Page
// ============================================================================

export default function FileListClient({
  initialFiles,
}: {
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = React.useState<FileRecord[]>(initialFiles);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<FileHealthStats | null>(() =>
    computeStats(initialFiles),
  );
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  // Re-fetches files only — join-table orphan detection runs server-side on
  // initial load, so a client refresh re-derives `orphaned` as "unknown" (false)
  // unless the page is reloaded. Good enough for a manual refresh between visits.
  async function loadFiles() {
    setLoading(true);
    const client = getAmplifyClient() as any;

    try {
      const allFiles: FileRecord[] = [];
      let nextToken: string | null = null;

      do {
        const {
          data,
          nextToken: token,
        }: { data: any; nextToken: string | null } =
          await client.models.File.list({
            limit: 500,
            nextToken,
            selectionSet: [
              "id",
              "name",
              "description",
              "mimeType",
              "path",
              "size",
              "thumbnail",
              "generated",
              "documentID",
              "owner",
              "createdAt",
              "updatedAt",
              "moderation.*",
              "embedding.*",
            ],
          });
        for (const item of data || []) {
          if (item) {
            allFiles.push({
              ...item,
              orphaned: files.find((f) => f.id === item.id)?.orphaned ?? false,
            });
          }
        }
        nextToken = token || null;
      } while (nextToken);

      setFiles(allFiles);
      setStats(computeStats(allFiles));
    } catch (err) {
      console.error("[FileMaintenance] Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(fileList: FileRecord[]): FileHealthStats {
    let orphaned = 0;
    let missingThumbnail = 0;
    let large = 0;
    let flagged = 0;
    let generated = 0;

    for (const f of fileList) {
      if (f.orphaned) orphaned++;
      if (!f.thumbnail) missingThumbnail++;
      if ((f.size || 0) > LARGE_FILE_BYTES) large++;
      if (f.moderation?.status === "flagged") flagged++;
      if (f.generated) generated++;
    }

    return {
      total: fileList.length,
      orphaned,
      missingThumbnail,
      large,
      flagged,
      generated,
    };
  }

  const filteredFiles = React.useMemo(() => {
    let result = files;

    switch (filter) {
      case "orphaned":
        result = result.filter((f) => f.orphaned);
        break;
      case "missing_thumbnail":
        result = result.filter((f) => !f.thumbnail);
        break;
      case "large":
        result = result.filter((f) => (f.size || 0) > LARGE_FILE_BYTES);
        break;
      case "flagged":
        result = result.filter((f) => f.moderation?.status === "flagged");
        break;
      case "generated":
        result = result.filter((f) => f.generated);
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          (f.name || "").toLowerCase().includes(q) ||
          (f.path || "").toLowerCase().includes(q) ||
          (f.mimeType || "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [files, filter, searchQuery]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredFiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredFiles.map((f) => f.id)));
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
        await client.models.File.delete({ id });
      } catch (err) {
        console.warn(`[FileMaintenance] Failed to delete ${id}:`, err);
      }
    }

    setSelected(new Set());
    setDeleting(false);

    await loadFiles();
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminRouteGuard>
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          File List Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage storage health: find files that are orphaned, missing
          thumbnails, unusually large, or flagged by moderation.
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
                label="Total Files"
                value={stats.total}
                onClick={() => setFilter("all")}
                active={filter === "all"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Orphaned"
                value={stats.orphaned}
                color="warning"
                onClick={() => setFilter("orphaned")}
                active={filter === "orphaned"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="No Thumbnail"
                value={stats.missingThumbnail}
                color="info"
                onClick={() => setFilter("missing_thumbnail")}
                active={filter === "missing_thumbnail"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <StatCard
                label="Large (>10MB)"
                value={stats.large}
                color="info"
                onClick={() => setFilter("large")}
                active={filter === "large"}
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
            placeholder="Search files..."
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
              <MenuItem value="all">All Files</MenuItem>
              <MenuItem value="orphaned">Orphaned</MenuItem>
              <MenuItem value="missing_thumbnail">No Thumbnail</MenuItem>
              <MenuItem value="large">Large (&gt;10MB)</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="generated">AI Generated</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
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
            <IconButton onClick={loadFiles} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {deleting && <LinearProgress sx={{ mb: 1 }} />}

        {/* File Table */}
        {loading ? (
          <Box>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                {filter === "all"
                  ? "No files found."
                  : "No files match this filter. All clear!"}
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
                        selected.size < filteredFiles.length
                      }
                      checked={selected.size === filteredFiles.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="center">Thumbnail</TableCell>
                  <TableCell align="center">Linked</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.slice(0, 200).map((file) => (
                  <TableRow
                    key={file.id}
                    hover
                    selected={selected.has(file.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        noWrap
                        sx={{ maxWidth: 260 }}
                      >
                        {file.name || file.path || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 140 }}
                      >
                        {file.mimeType || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={
                          (file.size || 0) > LARGE_FILE_BYTES
                            ? "warning.main"
                            : "text.secondary"
                        }
                      >
                        {formatBytes(file.size)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {file.thumbnail ? (
                        <ImageIcon fontSize="small" color="success" />
                      ) : (
                        <Chip
                          label="None"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {file.orphaned ? (
                        <Chip
                          label="Orphaned"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="✓"
                          size="small"
                          color="success"
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
                        {file.owner ? file.owner.slice(0, 12) + "..." : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {file.moderation?.status === "flagged" ? (
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

        {filteredFiles.length > 200 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Showing first 200 of {filteredFiles.length} files. Use search or
            filters to narrow results.
          </Alert>
        )}
      </Box>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Files"
        message={`Delete ${selected.size} file record(s)? This only removes the database record — the underlying S3 object is not deleted. This cannot be undone.`}
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
