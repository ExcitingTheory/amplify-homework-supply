import { randomUUID } from "node:crypto";
import { isConditionalCheckFailure, MAX_RETRY_ATTEMPTS } from "../shared/concurrency";

interface AnalysisState {
  runId: string;
  executionArn: string;
  state: string;
  startedAt?: string;
  totalPages?: number;
  done?: number;
  failed?: number;
  error?: string;
}

export interface AnalysisDocument {
  id: string;
  _version?: number | null;
  metadata?: string | null;
}

interface AnalysisMetadata {
  analysis?: AnalysisState;
  [key: string]: unknown;
}

interface StartAnalysisOptions {
  stateMachineArn: string;
  load(): Promise<AnalysisDocument>;
  claim(document: AnalysisDocument, update: { status: string; metadata: string }): Promise<void>;
  start(runId: string): Promise<void>;
}

function metadataOf(document: AnalysisDocument): AnalysisMetadata {
  return document.metadata ? JSON.parse(document.metadata) : {};
}

/** Concurrent upload/manual requests share one active, atomically claimed run. */
export async function startAnalysisRun(options: StartAnalysisOptions): Promise<{
  executionArn: string;
  reused: boolean;
}> {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
    const document = await options.load();
    const metadata = metadataOf(document);
    const previous = metadata.analysis;
    if (previous && !["completed", "failed", "cancelled"].includes(previous.state)) {
      if (!previous.executionArn) {
        throw new Error(`Active analysis for Document ${document.id} has no execution ARN; cancel it before retrying`);
      }
      return { executionArn: previous.executionArn, reused: true };
    }

    const runId = randomUUID();
    const executionArn = `${options.stateMachineArn.replace(":stateMachine:", ":execution:")}:${runId}`;
    const analysis: AnalysisState = {
      runId, executionArn, state: "preparing", startedAt: new Date().toISOString(),
      totalPages: 0, done: 0, failed: 0,
    };
    try {
      await options.claim(document, {
        status: "analyzing",
        metadata: JSON.stringify({ ...metadata, analysis }),
      });
    } catch (error) {
      if (isConditionalCheckFailure(error) && attempt + 1 < MAX_RETRY_ATTEMPTS) continue;
      throw error;
    }

    try {
      await options.start(runId);
      return { executionArn, reused: false };
    } catch (error) {
      const current = await options.load();
      const currentMetadata = metadataOf(current);
      if (currentMetadata.analysis?.runId === runId) {
        try {
          await options.claim(current, {
            status: "failed",
            metadata: JSON.stringify({
              ...currentMetadata,
              analysis: {
                ...currentMetadata.analysis, state: "failed",
                error: error instanceof Error ? error.message : String(error),
              },
            }),
          });
        } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], `Analysis startup and failure registration failed for ${document.id}`);
        }
      }
      throw error;
    }
  }
  throw new Error("Unable to claim document analysis after concurrent updates");
}
