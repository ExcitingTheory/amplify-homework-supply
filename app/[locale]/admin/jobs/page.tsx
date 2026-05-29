"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { listJobs, retryJob, cancelJob, type JobRecord } from "../../../actions/jobs";

// ============================================================================
// Status chip color mapping
// ============================================================================

function getStatusColor(status: string): "error" | "warning" | "info" | "success" | "default" {
  switch (status) {
    case "failed":
    case "ERROR":
      return "error";
    case "processing":
    case "extracting":
    case "analyzing":
    case "PROCESSING":
      return "warning";
    case "queued":
    case "PENDING":
    case "extracted":
      return "info";
    case "completed":
    case "COMPLETE":
      return "success";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "agent_job":
      return "Agent Job";
    case "document_analysis":
      return "Document Analysis";
    case "media_transcode":
      return "Media Transcode";
    default:
      return type;
  }
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3600_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < 86400_000) return `${Math.round(diffMs / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

function getDuration(startedAt?: string | null, completedAt?: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 1000) return "<1s";
  if (diffMs < 60_000) return `${Math.round(diffMs / 1000)}s`;
  if (diffMs < 3600_000) return `${Math.round(diffMs / 60_000)}m`;
  return `${Math.round(diffMs / 3600_000)}h`;
}

// ============================================================================
// Page Component
// ============================================================================

/**
 * Jobs dashboard accessible to Admins and Instructors.
 * Shows all background processing jobs (document analysis, transcoding, AI tasks)
 * with the ability to retry stuck/failed jobs.
 */
function JobsDashboard() {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("active");
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  const fetchJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter: { status?: string; type?: string } = {};
      if (typeFilter !== "all") filter.type = typeFilter;
      // "active" shows default (processing + queued + failed), "all" shows everything
      if (statusFilter !== "all" && statusFilter !== "active") {
        filter.status = statusFilter;
      }
      const results = await listJobs(
        Object.keys(filter).length > 0 ? filter : undefined
      );
      setJobs(results);
    } catch (err) {
      console.error("[Jobs] Failed to fetch:", err);
      setSnackbar({ open: true, message: "Failed to fetch jobs", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh every 30s while page is visible
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchJobs();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRetry = async (job: JobRecord) => {
    setActionInProgress(job.id);
    try {
      const result = await retryJob(job.id, job.type);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
      if (result.success) fetchJobs();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Retry failed", severity: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (job: JobRecord) => {
    setActionInProgress(job.id);
    try {
      const result = await cancelJob(job.id, job.type);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
      if (result.success) fetchJobs();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Cancel failed", severity: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const canRetry = (job: JobRecord) =>
    ["failed", "ERROR", "processing", "extracting", "analyzing", "PROCESSING"].includes(job.status);

  const canCancel = (job: JobRecord) =>
    ["queued", "processing", "extracting", "analyzing", "PROCESSING", "PENDING"].includes(job.status);

  const activeCount = jobs.filter((j) =>
    ["processing", "extracting", "analyzing", "PROCESSING", "queued", "PENDING"].includes(j.status)
  ).length;

  const failedCount = jobs.filter((j) =>
    ["failed", "ERROR"].includes(j.status)
  ).length;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Agent Jobs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {activeCount > 0 && (
              <Chip label={`${activeCount} active`} color="warning" size="small" sx={{ mr: 1 }} />
            )}
            {failedCount > 0 && (
              <Chip label={`${failedCount} failed`} color="error" size="small" sx={{ mr: 1 }} />
            )}
            {jobs.length} total jobs
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="agent_job">Agent Jobs</MenuItem>
              <MenuItem value="document_analysis">Document Analysis</MenuItem>
              <MenuItem value="media_transcode">Media Transcode</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="active">Active / Failed</MenuItem>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={fetchJobs} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Jobs Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Retries</TableCell>
              <TableCell>Error</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && jobs.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No jobs matching the current filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={`${job.type}-${job.id}`}
                  sx={{
                    opacity: actionInProgress === job.id ? 0.5 : 1,
                    bgcolor:
                      job.status === "failed" || job.status === "ERROR"
                        ? "error.50"
                        : undefined,
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {getTypeLabel(job.type)}
                    </Typography>
                    {job.subType && (
                      <Typography variant="caption" color="text.secondary">
                        {job.subType}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status)}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {job.owner ? job.owner.slice(0, 12) + "…" : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {job.resourceName || job.resourceId?.slice(0, 12) || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatTime(job.startedAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDuration(job.startedAt, job.completedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(job.retryCount ?? 0) > 0 ? (
                      <Chip label={job.retryCount} size="small" variant="outlined" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {job.error?.message ? (
                      <Tooltip title={job.error.message}>
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "help",
                          }}
                        >
                          {job.error.message}
                        </Typography>
                      </Tooltip>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                      {canRetry(job) && (
                        <Tooltip title="Retry">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRetry(job)}
                              disabled={actionInProgress === job.id}
                            >
                              <ReplayIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {canCancel(job) && (
                        <Tooltip title="Cancel">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancel(job)}
                              disabled={actionInProgress === job.id}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Retry All Failed button */}
      {failedCount > 0 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ReplayIcon />}
            onClick={async () => {
              const failedJobs = jobs.filter((j) =>
                ["failed", "ERROR"].includes(j.status)
              );
              for (const job of failedJobs) {
                await retryJob(job.id, job.type);
              }
              setSnackbar({
                open: true,
                message: `Retried ${failedJobs.length} failed jobs`,
                severity: "info",
              });
              fetchJobs();
            }}
          >
            Retry All Failed ({failedCount})
          </Button>
        </Box>
      )}

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function AdminJobsPage() {
  return (
      <AdminRouteGuard>
        <JobsDashboard />
      </AdminRouteGuard>
  );
}
