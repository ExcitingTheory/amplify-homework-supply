/** Years ahead of "now" beyond which a stored due date is treated as an undated/draft placeholder rather than a real deadline. */
const PLACEHOLDER_DUE_DATE_YEARS_AHEAD = 3;

/** True when `dueDate` is unrealistically far in the future (a backend placeholder for "no due date"). */
export function isPlaceholderDueDate(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return false;
  const threshold =
    Date.now() + PLACEHOLDER_DUE_DATE_YEARS_AHEAD * 365 * 24 * 60 * 60 * 1000;
  return due > threshold;
}
