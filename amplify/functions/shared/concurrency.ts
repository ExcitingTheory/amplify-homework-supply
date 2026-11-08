/**
 * Shared optimistic-concurrency retry helpers for Lambda functions that do
 * read-modify-write against a shared aggregate row (Squad, GroupChallenge,
 * Assignment, Section, StudentProfile, SectionProgress, etc).
 *
 * `_version` in this schema is a plain app-convention field — AppSync does
 * NOT enforce it automatically (no DataStore/conflict-resolution enabled).
 * Writers must pass the generated `condition: { _version: { eq } }` argument
 * themselves and retry with a fresh re-read on conflict; these helpers
 * standardize that retry loop's backoff and conflict detection.
 */

export const MAX_RETRY_ATTEMPTS = 5;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with jitter, capped — conflicts at this scale self-heal within a few ms. */
export function backoffMs(attempt: number): number {
  return Math.min(1000, 25 * 2 ** attempt) + Math.floor(Math.random() * 25);
}

/** True when the error looks like our optimistic-concurrency condition failing (safe to retry with a fresh read). */
export function isConditionalCheckFailure(err: any): boolean {
  // AppSync reports the DynamoDB exception name in `errorType`; `message` only
  // says "The conditional request failed", so both must be inspected.
  if (Array.isArray(err?.errors)) {
    for (const e of err.errors) {
      if (
        /ConditionalCheckFailed/i.test(e?.errorType || "") ||
        /ConditionalCheckFailed|conditional request failed/i.test(
          e?.message || "",
        )
      ) {
        return true;
      }
    }
  }
  const message = err?.message || JSON.stringify(err || "");
  return /ConditionalCheckFailed|conditional request failed/i.test(message);
}

export interface VersionGuard {
  /** Value to write into `_version` alongside the update. */
  nextVersion: number;
  /** AppSync `condition` argument that only matches the row state we read. */
  condition: Record<string, unknown>;
}

/**
 * Builds the optimistic-lock guard for a row we just read. Rows created
 * without `_version` have no such attribute in DynamoDB, so an `eq` condition
 * can never match them — guard those with `attributeExists: false` instead.
 */
export function versionGuard(
  currentVersion: number | null | undefined,
): VersionGuard {
  if (currentVersion == null) {
    return {
      nextVersion: 1,
      condition: { _version: { attributeExists: false } },
    };
  }
  return {
    nextVersion: currentVersion + 1,
    condition: { _version: { eq: currentVersion } },
  };
}

/**
 * Lambda's runtime logs non-Error throwables as "[object Object]". Wrap AppSync
 * error payloads in a real Error so the failure reason survives in CloudWatch.
 */
export function toReadableError(err: unknown, context: string): Error {
  if (err instanceof Error) return err;
  let detail: string;
  try {
    detail = JSON.stringify(err);
  } catch {
    detail = String(err);
  }
  const wrapped = new Error(`${context}: ${detail}`);
  (wrapped as Error & { cause?: unknown }).cause = err;
  return wrapped;
}
