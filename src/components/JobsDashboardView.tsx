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
import { useTranslations } from "next-intl";
import type { JobRecord } from "../../app/actions/jobs";

// ============================================================================
// Status/time helpers (pure — no i18n; return colors or data-derived strings)
// ============================================================================

export function getStatusColor(
  status: string,
): "error" | "warning" | "info" | "success" | "default" {
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

export function formatTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3600_000) return `${Math.round(diffMs / 60_000)}m ago`;
  if (diffMs < 86400_000) return `${Math.round(diffMs / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export function getDuration(
  startedAt?: string | null,
  completedAt?: string | null,
): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 1000) return "<1s";
  if (diffMs < 60_000) return `${Math.round(diffMs / 1000)}s`;
  if (diffMs < 3600_000) return `${Math.round(diffMs / 60_000)}m`;
  return `${Math.round(diffMs / 3600_000)}h`;
}

const RETRYABLE = [
  "failed",
  "ERROR",
  "processing",
  "extracting",
  "analyzing",
  "PROCESSING",
];
const CANCELLABLE = [
  "queued",
  "processing",
  "extracting",
  "analyzing",
  "PROCESSING",
  "PENDING",
];

// ============================================================================
// View
// ============================================================================

export interface JobsDashboardSnackbar {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
}

export interface JobsDashboardViewProps {
  jobs: JobRecord[];
  loading: boolean;
  compact?: boolean;
  typeFilter: string;
  statusFilter: string;
  actionInProgress: string | null;
  snackbar: JobsDashboardSnackbar;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  onRetry: (job: JobRecord) => void;
  onCancel: (job: JobRecord) => void;
  onRetryAllFailed: () => void;
  onSnackbarClose: () => void;
}

/**
 * JobsDashboardView — presentational background-jobs table. Renders from plain
 * props so it can be shown without the `app/actions/jobs` server actions the
 * JobsDashboard container calls.
 */
export function JobsDashboardView({
  jobs,
  loading,
  compact = false,
  typeFilter,
  statusFilter,
  actionInProgress,
  snackbar,
  onTypeFilterChange,
  onStatusFilterChange,
  onRefresh,
  onRetry,
  onCancel,
  onRetryAllFailed,
  onSnackbarClose,
}: JobsDashboardViewProps) {
  const t = useTranslations("components");

  const typeLabel = (type: string): string => {
    switch (type) {
      case "agent_job":
        return t("jobsDashboard.typeAgentJob");
      case "document_analysis":
        return t("jobsDashboard.typeDocumentAnalysis");
      case "media_transcode":
        return t("jobsDashboard.typeMediaTranscode");
      default:
        return type;
    }
  };

  const canRetry = (job: JobRecord) => RETRYABLE.includes(job.status);
  const canCancel = (job: JobRecord) => CANCELLABLE.includes(job.status);

  const activeCount = jobs.filter((j) => CANCELLABLE.includes(j.status)).length;
  const failedCount = jobs.filter((j) =>
    ["failed", "ERROR"].includes(j.status),
  ).length;

  return (
    <Box sx={{ p: compact ? 1.5 : 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {activeCount > 0 && (
            <Chip
              label={t("jobsDashboard.active", { count: activeCount })}
              color="warning"
              size="small"
            />
          )}
          {failedCount > 0 && (
            <Chip
              label={t("jobsDashboard.failed", { count: failedCount })}
              color="error"
              size="small"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {t("jobsDashboard.totalJobs", { count: jobs.length })}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t("jobsDashboard.type")}</InputLabel>
            <Select
              value={typeFilter}
              label={t("jobsDashboard.type")}
              onChange={(e) => onTypeFilterChange(e.target.value)}
            >
              <MenuItem value="all">{t("jobsDashboard.allTypes")}</MenuItem>
              <MenuItem value="agent_job">
                {t("jobsDashboard.agentJobs")}
              </MenuItem>
              <MenuItem value="document_analysis">
                {t("jobsDashboard.docAnalysis")}
              </MenuItem>
              <MenuItem value="media_transcode">
                {t("jobsDashboard.mediaTranscode")}
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t("jobsDashboard.status")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("jobsDashboard.status")}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="active">
                {t("jobsDashboard.activeFailed")}
              </MenuItem>
              <MenuItem value="all">{t("jobsDashboard.allStatuses")}</MenuItem>
              <MenuItem value="queued">{t("jobsDashboard.queued")}</MenuItem>
              <MenuItem value="processing">
                {t("jobsDashboard.processing")}
              </MenuItem>
              <MenuItem value="failed">
                {t("jobsDashboard.failedStatus")}
              </MenuItem>
              <MenuItem value="completed">
                {t("jobsDashboard.completed")}
              </MenuItem>
              <MenuItem value="cancelled">
                {t("jobsDashboard.cancelled")}
              </MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={t("jobsDashboard.refresh")}>
            <span>
              <IconButton onClick={onRefresh} disabled={loading} size="small">
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
              <TableCell>{t("jobsDashboard.colType")}</TableCell>
              <TableCell>{t("jobsDashboard.colStatus")}</TableCell>
              <TableCell>{t("jobsDashboard.colOwner")}</TableCell>
              <TableCell>{t("jobsDashboard.colResource")}</TableCell>
              <TableCell>{t("jobsDashboard.colStarted")}</TableCell>
              <TableCell>{t("jobsDashboard.colDuration")}</TableCell>
              <TableCell>{t("jobsDashboard.colRetries")}</TableCell>
              <TableCell>{t("jobsDashboard.colError")}</TableCell>
              <TableCell align="right">
                {t("jobsDashboard.colActions")}
              </TableCell>
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
                    {t("jobsDashboard.noJobs")}
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
                      {typeLabel(job.type)}
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
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 100,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {job.owner ? job.owner.slice(0, 10) + "…" : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 130,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {job.resourceName || job.resourceId?.slice(0, 10) || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(job.startedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDuration(job.startedAt, job.completedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(job.retryCount ?? 0) > 0 ? (
                      <Chip
                        label={job.retryCount}
                        size="small"
                        variant="outlined"
                      />
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
                            maxWidth: 160,
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
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        justifyContent: "flex-end",
                      }}
                    >
                      {canRetry(job) && (
                        <Tooltip title={t("jobsDashboard.retry")}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onRetry(job)}
                              disabled={actionInProgress === job.id}
                            >
                              <ReplayIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {canCancel(job) && (
                        <Tooltip title={t("jobsDashboard.cancel")}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onCancel(job)}
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

      {/* Retry All Failed */}
      {failedCount > 0 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<ReplayIcon />}
            onClick={onRetryAllFailed}
          >
            {t("jobsDashboard.retryAllFailed", { count: failedCount })}
          </Button>
        </Box>
      )}

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={onSnackbarClose}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default JobsDashboardView;
