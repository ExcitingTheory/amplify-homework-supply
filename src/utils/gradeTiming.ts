export function formatGradeDuration(
  seconds: number | null | undefined,
): string {
  const safeSeconds = Math.max(0, seconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

export function getGradeCompletionSeconds(
  grade:
    | {
        createdAt?: string | null;
        updatedAt?: string | null;
        complete?: boolean | null;
        timerStarted?: boolean | null;
      }
    | null
    | undefined,
): number | null {
  if (
    !grade?.timerStarted ||
    !grade.complete ||
    !grade.createdAt ||
    !grade.updatedAt
  ) {
    return null;
  }

  const startedAt = new Date(grade.createdAt).getTime();
  const finishedAt = new Date(grade.updatedAt).getTime();
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt)) {
    return null;
  }

  return Math.max(0, Math.round((finishedAt - startedAt) / 1000));
}

export function getGradeCompletionLabel(
  grade:
    | {
        createdAt?: string | null;
        updatedAt?: string | null;
        complete?: boolean | null;
        timerStarted?: boolean | null;
      }
    | null
    | undefined,
): string | null {
  const completionSeconds = getGradeCompletionSeconds(grade);
  if (completionSeconds == null) return null;
  return `Completed in ${formatGradeDuration(completionSeconds)}`;
}
