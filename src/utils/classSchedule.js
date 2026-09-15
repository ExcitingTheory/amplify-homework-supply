// Computes the next occurrence of any section's scheduled weekly class meeting.
// Falls back to 2 days from now at 9:00 when no section has a classSchedule.
export function getNextClassDate(
  selectedSectionIds,
  allSections,
  now = new Date(),
) {
  const selectedIds = new Set(
    (selectedSectionIds || []).map((s) => (typeof s === "string" ? s : s?.id)),
  );
  const relevantSections = (allSections || []).filter(
    (s) => s != null && (selectedIds.size === 0 || selectedIds.has(s.id)),
  );

  let earliest = null;
  for (const section of relevantSections) {
    for (const entry of section.classSchedule || []) {
      if (entry?.dayOfWeek == null || !entry?.startTime) continue;
      const [hours, minutes] = entry.startTime.split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

      const daysUntil = (entry.dayOfWeek - now.getDay() + 7) % 7;
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + daysUntil);
      candidate.setHours(hours, minutes, 0, 0);
      if (candidate <= now) candidate.setDate(candidate.getDate() + 7);

      if (!earliest || candidate < earliest) earliest = candidate;
    }
  }

  if (earliest) return earliest;

  const fallback = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}
