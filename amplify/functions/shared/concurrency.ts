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
  const message =
    err?.errors?.[0]?.message || err?.message || JSON.stringify(err || "");
  return /ConditionalCheckFailed/i.test(message);
}
