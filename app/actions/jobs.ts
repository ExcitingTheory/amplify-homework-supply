"use server";

/**
 * Agent Jobs Server Actions
 *
 * Available to Admins and Instructors for managing background jobs:
 * - List in-progress / stuck jobs
 * - Retry failed or stuck jobs by re-invoking their Lambda
 * - Cancel running jobs
 */

import { getServerClient } from "@/utils/amplifyServerClient";

// ============================================================================
// Types
// ============================================================================

export interface JobRecord {
  id: string;
  type: "agent_job" | "document_analysis" | "media_transcode";
  subType?: string; // pdf_analysis, exercise_generation, etc.
  status: string;
  owner?: string;
  error?: { message?: string; code?: string; timestamp?: string } | null;
  startedAt?: string | null;
  completedAt?: string | null;
  retryCount?: number;
  resourceId?: string; // documentID, fileID, etc.
  resourceName?: string;
  updatedAt?: string;
}

// ============================================================================
// Helpers
// ============================================================================

async function getAuthenticatedClient() {
  const client = getServerClient();
  // Auth enforced by Amplify authorization directives on each model
  // AgentJob: allow.authenticated() — Admins + Instructors + Learners can read
  // Retry/cancel actions require write, allowed by allow.authenticated()
  return client;
}

function isStuck(
  startedAt: string | null | undefined,
  thresholdMinutes = 30,
): boolean {
  if (!startedAt) return false;
  const started = new Date(startedAt).getTime();
  const now = Date.now();
  return now - started > thresholdMinutes * 60 * 1000;
}

// ============================================================================
// List Jobs
// ============================================================================

export async function listJobs(filter?: {
  status?: string;
  type?: string;
}): Promise<JobRecord[]> {
  const client = await getAuthenticatedClient();
  const jobs: JobRecord[] = [];

  // 1. AgentJob records
  try {
    const agentJobFilter: Record<string, any> = {};
    if (filter?.status) {
      agentJobFilter.status = { eq: filter.status };
    }
    if (filter?.type === "agent_job" || !filter?.type) {
      const { data: agentJobs } = await (client.models as any).AgentJob.list({
        filter:
          Object.keys(agentJobFilter).length > 0 ? agentJobFilter : undefined,
        limit: 200,
      });
      for (const job of agentJobs || []) {
        if (!job) continue;
        jobs.push({
          id: job.id,
          type: "agent_job",
          subType: job.type,
          status: job.status,
          owner: job.owner || job.identityId,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          retryCount: job.retryCount || 0,
          resourceId: job.documentID || job.unitID,
          updatedAt: job.updatedAt,
        });
      }
    }
  } catch (err) {
    console.warn("[Jobs] Failed to fetch AgentJob records:", err);
  }

  // 2. Documents in non-terminal states (extracting, analyzing)
  if (!filter?.type || filter.type === "document_analysis") {
    try {
      const docFilter: Record<string, any> = {};
      if (filter?.status) {
        docFilter.status = { eq: filter.status };
      } else {
        // Show documents in processing states by default
        docFilter.or = [
          { status: { eq: "extracting" } },
          { status: { eq: "analyzing" } },
          { status: { eq: "extracted" } },
          { status: { eq: "failed" } },
        ];
      }
      const { data: docs } = await (client.models as any).Document.list({
        filter: docFilter,
        limit: 200,
      });
      for (const doc of docs || []) {
        if (!doc) continue;
        jobs.push({
          id: doc.id,
          type: "document_analysis",
          subType: "pdf_analysis",
          status: doc.status || "unknown",
          owner: doc.owner,
          startedAt: doc.updatedAt,
          resourceId: doc.fileID || doc.id,
          resourceName: doc.title || doc.id,
          updatedAt: doc.updatedAt,
        });
      }
    } catch (err) {
      console.warn("[Jobs] Failed to fetch Document records:", err);
    }
  }

  // 3. Files with stuck transcode status
  if (!filter?.type || filter.type === "media_transcode") {
    try {
      const fileFilter: Record<string, any> = {};
      if (filter?.status) {
        fileFilter.transcodeStatus = { eq: filter.status.toUpperCase() };
      } else {
        fileFilter.or = [
          { transcodeStatus: { eq: "PENDING" } },
          { transcodeStatus: { eq: "PROCESSING" } },
          { transcodeStatus: { eq: "ERROR" } },
        ];
      }
      const { data: files } = await (client.models as any).File.list({
        filter: fileFilter,
        limit: 200,
      });
      for (const file of files || []) {
        if (!file) continue;
        jobs.push({
          id: file.id,
          type: "media_transcode",
          subType: "hls_transcode",
          status: file.transcodeStatus || "unknown",
          owner: file.owner,
          startedAt: file.updatedAt,
          resourceId: file.id,
          resourceName: file.name || file.key,
          updatedAt: file.updatedAt,
        });
      }
    } catch (err) {
      console.warn("[Jobs] Failed to fetch File transcode records:", err);
    }
  }

  // Sort: in-progress/stuck first, then by most recent
  jobs.sort((a, b) => {
    const statusPriority: Record<string, number> = {
      processing: 0,
      extracting: 0,
      analyzing: 0,
      PROCESSING: 0,
      queued: 1,
      PENDING: 1,
      extracted: 1,
      failed: 2,
      ERROR: 2,
      completed: 3,
      COMPLETE: 3,
      cancelled: 4,
    };
    const aPriority = statusPriority[a.status] ?? 5;
    const bPriority = statusPriority[b.status] ?? 5;
    if (aPriority !== bPriority) return aPriority - bPriority;
    // Then by date descending
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  return jobs;
}

// ============================================================================
// Retry Job
// ============================================================================

export async function retryJob(
  jobId: string,
  jobType: "agent_job" | "document_analysis" | "media_transcode",
): Promise<{ success: boolean; message: string }> {
  const client = await getAuthenticatedClient();

  try {
    switch (jobType) {
      case "agent_job": {
        // Reset AgentJob status and bump retry count
        const { data: job } = await (client.models as any).AgentJob.get({
          id: jobId,
        });
        if (!job) return { success: false, message: "Job not found" };

        await (client.models as any).AgentJob.update({
          id: jobId,
          status: "queued",
          error: null,
          retryCount: (job.retryCount || 0) + 1,
          startedAt: null,
          completedAt: null,
          _version: job._version,
        });

        // Re-invoke the appropriate Lambda based on job type
        if (job.type === "pdf_analysis" && job.documentID) {
          await (client as any).mutations.analyzeDocument({
            fileID: job.documentID,
          });
        }

        return {
          success: true,
          message: `Job ${jobId} queued for retry (#${(job.retryCount || 0) + 1})`,
        };
      }

      case "document_analysis": {
        // Reset Document status and re-invoke analyzeDocument
        const { data: doc } = await (client.models as any).Document.get({
          id: jobId,
        });
        if (!doc) return { success: false, message: "Document not found" };

        // Reset to uploaded so the Lambda starts fresh
        await (client.models as any).Document.update({
          id: jobId,
          status: "uploaded",
          _version: doc._version,
        });

        // Re-invoke the analyzeDocument mutation
        const fileID = doc.fileID || jobId;
        await (client as any).mutations.analyzeDocument({ fileID });

        return {
          success: true,
          message: `Document analysis restarted for ${doc.title || jobId}`,
        };
      }

      case "media_transcode": {
        // Reset File transcode status — the Lambda is triggered by the status update
        // or we'd need to manually invoke it
        const { data: file } = await (client.models as any).File.get({
          id: jobId,
        });
        if (!file) return { success: false, message: "File not found" };

        await (client.models as any).File.update({
          id: jobId,
          transcodeStatus: "PENDING",
          mediaConvertJobId: null,
          _version: file._version,
        });

        // MediaConvert Lambda is triggered by S3 events, not mutations
        // For retry, we re-invoke it if there's a processFileVideo mutation
        // Otherwise the status reset allows manual re-trigger from the UI
        return {
          success: true,
          message: `Transcode status reset for ${file.name || jobId}. Re-upload or re-trigger to start.`,
        };
      }

      default:
        return { success: false, message: `Unknown job type: ${jobType}` };
    }
  } catch (err: any) {
    console.error("[Jobs] Retry failed:", err);
    return { success: false, message: err.message || "Retry failed" };
  }
}

// ============================================================================
// Cancel Job
// ============================================================================

export async function cancelJob(
  jobId: string,
  jobType: "agent_job" | "document_analysis" | "media_transcode",
): Promise<{ success: boolean; message: string }> {
  const client = await getAuthenticatedClient();

  try {
    switch (jobType) {
      case "agent_job": {
        const { data: job } = await (client.models as any).AgentJob.get({
          id: jobId,
        });
        if (!job) return { success: false, message: "Job not found" };
        await (client.models as any).AgentJob.update({
          id: jobId,
          status: "cancelled",
          completedAt: new Date().toISOString(),
          _version: job._version,
        });
        return { success: true, message: "Job cancelled" };
      }

      case "document_analysis": {
        const { data: doc } = await (client.models as any).Document.get({
          id: jobId,
        });
        if (!doc) return { success: false, message: "Document not found" };
        // Use the existing cancelDocumentAnalysis mutation
        const fileID = doc.fileID || jobId;
        await (client as any).mutations.cancelDocumentAnalysis({ fileID });
        return { success: true, message: "Document analysis cancelled" };
      }

      case "media_transcode": {
        const { data: file } = await (client.models as any).File.get({
          id: jobId,
        });
        if (!file) return { success: false, message: "File not found" };
        await (client.models as any).File.update({
          id: jobId,
          transcodeStatus: "ERROR",
          _version: file._version,
        });
        return { success: true, message: "Transcode cancelled" };
      }

      default:
        return { success: false, message: `Unknown job type: ${jobType}` };
    }
  } catch (err: any) {
    console.error("[Jobs] Cancel failed:", err);
    return { success: false, message: err.message || "Cancel failed" };
  }
}
