"use client";
import * as React from "react";
import {
  listJobs,
  retryJob,
  cancelJob,
  type JobRecord,
} from "../../app/actions/jobs";
import { JobsDashboardView } from "./JobsDashboardView";

// Re-export pure helpers for backwards compatibility with existing importers.
export { getStatusColor, formatTime, getDuration } from "./JobsDashboardView";

/**
 * Jobs dashboard for Admins and Instructors.
 * Shows background processing jobs with retry/cancel actions.
 * Can be embedded in a panel (compact=true) or used as a full-page view.
 */
export default function JobsDashboard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [jobs, setJobs] = React.useState<JobRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("active");
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(
    null,
  );

  const fetchJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter: { status?: string; type?: string } = {};
      if (typeFilter !== "all") filter.type = typeFilter;
      if (statusFilter !== "all" && statusFilter !== "active") {
        filter.status = statusFilter;
      }
      const results = await listJobs(
        Object.keys(filter).length > 0 ? filter : undefined,
      );
      setJobs(results);
    } catch (err) {
      console.error("[Jobs] Failed to fetch:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch jobs",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh every 30s while visible
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
      setSnackbar({
        open: true,
        message: err.message || "Retry failed",
        severity: "error",
      });
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
      setSnackbar({
        open: true,
        message: err.message || "Cancel failed",
        severity: "error",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetryAllFailed = async () => {
    const failedJobs = jobs.filter((j) =>
      ["failed", "ERROR"].includes(j.status),
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
  };

  return (
    <JobsDashboardView
      jobs={jobs}
      loading={loading}
      compact={compact}
      typeFilter={typeFilter}
      statusFilter={statusFilter}
      actionInProgress={actionInProgress}
      snackbar={snackbar}
      onTypeFilterChange={setTypeFilter}
      onStatusFilterChange={setStatusFilter}
      onRefresh={fetchJobs}
      onRetry={handleRetry}
      onCancel={handleCancel}
      onRetryAllFailed={handleRetryAllFailed}
      onSnackbarClose={() => setSnackbar((s) => ({ ...s, open: false }))}
    />
  );
}
