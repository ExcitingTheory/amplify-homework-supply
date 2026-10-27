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
