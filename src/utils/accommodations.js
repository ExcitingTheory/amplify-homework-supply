/**
 * Per-student accommodations helpers.
 *
 * Accommodations are stored on `Section.accommodations` as a JSON object keyed
 * by student ID:
 *   { [studentId]: { dueDateExtensionDays?, timeMultiplier?, note?, updatedAt } }
 *
 * - dueDateExtensionDays: whole/partial days added to every assignment due date
 *   for that student in the section.
 * - timeMultiplier: multiplies any timed-assignment allowance (e.g. 1.5 = 150%).
 * - note: free-text instructor note.
 */

/**
 * Normalize the raw `Section.accommodations` value (string or object) into an object.
 * @param {unknown} raw
 * @returns {Record<string, { dueDateExtensionDays?: number, timeMultiplier?: number, note?: string, updatedAt?: string }>}
 */
export function parseAccommodations(raw) {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Get a single student's accommodation entry, or null.
 * @param {unknown} accommodations - raw or parsed accommodations
 * @param {string} studentId
 */
export function getStudentAccommodation(accommodations, studentId) {
  if (!studentId) return null;
  const map =
    accommodations &&
    typeof accommodations === "object" &&
    !("length" in accommodations)
      ? accommodations
      : parseAccommodations(accommodations);
  const entry = map[studentId];
  return entry && typeof entry === "object" ? entry : null;
}

/**
 * True when the entry carries a meaningful accommodation.
 * @param {{ dueDateExtensionDays?: number, timeMultiplier?: number, note?: string } | null | undefined} entry
 */
export function hasAccommodation(entry) {
  if (!entry) return false;
  const days = Number(entry.dueDateExtensionDays) || 0;
  const mult = Number(entry.timeMultiplier) || 1;
  const note = (entry.note || "").trim();
  return days > 0 || mult > 1 || note.length > 0;
}

/**
 * Apply a student's due-date extension to an assignment due date.
 * @param {string | Date | null | undefined} dueDate - base due date
 * @param {{ dueDateExtensionDays?: number } | null | undefined} accommodation
 * @returns {string | null} ISO string of the effective due date, or null when no base date
 */
export function getEffectiveDueDate(dueDate, accommodation) {
  if (!dueDate) return null;
  const base = new Date(dueDate);
  if (Number.isNaN(base.getTime())) return null;
  const days = Number(accommodation?.dueDateExtensionDays) || 0;
  if (days <= 0) return base.toISOString();
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Apply a student's time multiplier to a timed allowance (in whatever unit is passed).
 * @param {number | null | undefined} allowance
 * @param {{ timeMultiplier?: number } | null | undefined} accommodation
 * @returns {number | null}
 */
export function getEffectiveTimeAllowance(allowance, accommodation) {
  if (allowance == null) return allowance ?? null;
  const mult = Number(accommodation?.timeMultiplier);
  if (!mult || mult <= 1) return allowance;
  return Math.round(allowance * mult);
}
