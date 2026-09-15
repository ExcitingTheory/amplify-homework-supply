"use client";
import React, { Suspense, lazy } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Skeleton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// Lazy-load EventCalendar from @mui/x-scheduler only when dialog opens
const EventCalendar = lazy(() =>
  import("@mui/x-scheduler/event-calendar").then((m) => ({
    default: m.EventCalendar,
  })),
);
import { getAmplifyClient } from "@/utils/amplifyClient";
import {
  BUILT_IN_TIMING_PATTERNS,
  resolveTimingWindow,
} from "@/utils/assignmentTiming";
import { TimingPatternPicker } from "@/components/TimingPatternPicker";

function meetingDates(section, startDate, weeks) {
  const schedule = [...(section?.classSchedule || [])]
    .filter((entry) => Number.isInteger(entry?.dayOfWeek))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  if (schedule.length === 0) return [];

  const first = new Date(`${startDate}T12:00:00`);
  const weekStart = new Date(first);
  weekStart.setDate(first.getDate() - first.getDay());
  const dates = [];
  for (let week = 0; week < weeks; week += 1) {
    for (const entry of schedule) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + week * 7 + entry.dayOfWeek);
      date.setHours(23, 59, 0, 0);
      dates.push(date);
    }
  }
  return dates;
}

function cadenceForAssignments(assignments, slots = []) {
  const slotNames = new Map(
    slots.filter(Boolean).map((slot) => [slot.id, slot.name]),
  );
  const sorted = [...assignments]
    .filter(
      (assignment) =>
        assignment?.dueDate &&
        (Number.isInteger(assignment.cadenceWeek) ||
          Number.isInteger(assignment.cadenceMeetingIndex)),
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return sorted.map((assignment) => ({
    assignment,
    slotName: slotNames.get(assignment.slotID),
    week: Number.isInteger(assignment.cadenceWeek)
      ? assignment.cadenceWeek
      : null,
    meetingIndex: Number.isInteger(assignment.cadenceMeetingIndex)
      ? assignment.cadenceMeetingIndex
      : null,
  }));
}

export function CadenceCopyDialog({
  open,
  onClose,
  sections = [],
  units = [],
}) {
  const t = useTranslations("components.cadenceCopyDialog");
  const client = React.useMemo(() => getAmplifyClient(), []);
  const [source, setSource] = React.useState(null);
  const [targets, setTargets] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);
  const [startDate, setStartDate] = React.useState("");
  const [weeks, setWeeks] = React.useState(6);
  const [weeklyMeetingNumber, setWeeklyMeetingNumber] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [timingPattern, setTimingPattern] = React.useState(
    BUILT_IN_TIMING_PATTERNS[0],
  );

  React.useEffect(() => {
    if (!open) return;
    setMessage("");
    setStartDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  React.useEffect(() => {
    if (!source || !open) return;
    let active = true;
    setLoading(true);
    client.models.Assignment.list({ filter: { sectionID: { eq: source.id } } })
      .then(({ data, errors }) => {
        if (!active) return;
        if (errors?.length) throw new Error(errors[0]?.message);
        setAssignments((data || []).filter((item) => item != null));
      })
      .catch((error) => {
        if (active)
          setMessage(error.message || "Unable to load source assignments.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [client, open, source]);

  const cadence = React.useMemo(
    () => cadenceForAssignments(assignments, source?.assignmentSlots),
    [assignments, source?.assignmentSlots],
  );
  const assignmentsWithoutMetadata = assignments.filter(
    (assignment) =>
      assignment?.dueDate &&
      !Number.isInteger(assignment.cadenceWeek) &&
      !Number.isInteger(assignment.cadenceMeetingIndex),
  );
  const sourceWeeks = React.useMemo(
    () => Math.max(1, ...cadence.map((item) => item.week), 1),
    [cadence],
  );
  const effectiveWeeks = Math.min(
    Math.max(Number(weeks) || sourceWeeks, 1),
    52,
  );
  const preview = React.useMemo(() => {
    const rows = [];
    for (const target of targets) {
      const dates = meetingDates(target, startDate, effectiveWeeks);
      const meetingsPerWeek = target.classSchedule?.length || 0;
      for (const item of cadence) {
        if (item.meetingIndex !== null) {
          for (let week = 0; week < effectiveWeeks; week += 1) {
            const date = dates[week * meetingsPerWeek + item.meetingIndex];
            if (date) rows.push({ target, item, date, week: week + 1 });
          }
          continue;
        }

        const week = Math.max(1, item.week || 1);
        const weekDates = dates.slice(
          (week - 1) * meetingsPerWeek,
          week * meetingsPerWeek,
        );
        const requestedMeeting = Number(weeklyMeetingNumber);
        const meetingIndex =
          requestedMeeting > 0
            ? Math.min(requestedMeeting - 1, weekDates.length - 1)
            : weekDates.length - 1;
        const date = weekDates[meetingIndex];
        if (date) {
          rows.push({
            target,
            item,
            date,
            week,
            weeklyMeetingIndex: meetingIndex,
          });
        }
      }
    }
    return rows;
  }, [cadence, effectiveWeeks, startDate, targets, weeklyMeetingNumber]);

  const calendarEvents = React.useMemo(
    () =>
      preview.map(({ target, item, date, week, weeklyMeetingIndex }, index) => {
        const meetingIndex =
          item.meetingIndex !== null ? item.meetingIndex : weeklyMeetingIndex;
        const unitName = item.assignment.unitID
          ? units.find((unit) => unit.id === item.assignment.unitID)?.name ||
            item.assignment.unitID
          : "Open slot";
        const slotName =
          item.slotName || `Week ${week} · Meeting ${meetingIndex + 1}`;
        return {
          id: `${target.id}-${item.assignment.id}-${index}`,
          title: `${slotName}: ${unitName}`,
          description: target.name,
          start: date.toISOString(),
          end: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
        };
      }),
    [preview, units],
  );

  const handleCopy = async () => {
    if (!preview.length) return;
    setSaving(true);
    setMessage("");
    try {
      const existingByTarget = new Map();
      for (const target of targets) {
        const { data } = await client.models.Assignment.list({
          filter: { sectionID: { eq: target.id } },
        });
        existingByTarget.set(target.id, (data || []).filter(Boolean));
      }

      let created = 0;
      for (const row of preview) {
        const existing = existingByTarget.get(row.target.id) || [];
        const alreadyCopied = existing.some(
          (assignment) =>
            assignment.slotID ===
              `${row.week}-${
                row.item.meetingIndex !== null
                  ? row.item.meetingIndex
                  : row.weeklyMeetingIndex
              }` && assignment.unitID === row.item.assignment.unitID,
        );
        if (alreadyCopied) continue;
        const cadenceMetadata = {
          ...(row.item.week !== null ? { cadenceWeek: row.item.week } : {}),
          ...(row.item.meetingIndex !== null
            ? { cadenceMeetingIndex: row.item.meetingIndex }
            : {}),
        };
        if (!row.item.assignment.unitID) continue;
        const slotID = `${row.week}-${
          row.item.meetingIndex !== null
            ? row.item.meetingIndex
            : row.weeklyMeetingIndex
        }`;
        const targetSlot = {
          id: slotID,
          name:
            row.item.slotName ||
            `Week ${row.week} · Meeting ${
              (row.item.meetingIndex !== null
                ? row.item.meetingIndex
                : row.weeklyMeetingIndex) + 1
            }`,
          week: row.week,
          meetingIndex:
            row.item.meetingIndex !== null
              ? row.item.meetingIndex
              : row.weeklyMeetingIndex,
          dueDate: row.date.toISOString(),
          timingPatternId: timingPattern.id,
        };
        const targetSlots = row.target.assignmentSlots || [];
        if (!targetSlots.some((slot) => slot?.id === slotID)) {
          const { data: updatedTarget } = await client.models.Section.update({
            id: row.target.id,
            assignmentSlots: [...targetSlots, targetSlot],
            _version: row.target._version,
          });
          if (updatedTarget) {
            row.target.assignmentSlots = updatedTarget.assignmentSlots;
            row.target._version = updatedTarget._version;
          }
        }

        const assignmentInput = {
          sectionID: row.target.id,
          dueDate: resolveTimingWindow(
            timingPattern,
            row.date,
            row.target.classSchedule || [],
          ).availableUntil.toISOString(),
          ...(() => {
            const timingWindow = resolveTimingWindow(
              timingPattern,
              row.date,
              row.target.classSchedule || [],
            );
            return {
              availableFrom: timingWindow.availableFrom.toISOString(),
              availableUntil: timingWindow.availableUntil.toISOString(),
              allowLateCompletion: timingWindow.allowLateCompletion,
              timingPatternId: timingPattern.id,
            };
          })(),
          slotID,
          unitID: row.item.assignment.unitID,
          status: row.item.assignment.status,
          ...cadenceMetadata,
        };
        const { data } = await client.models.Assignment.create(assignmentInput);
        if (data) existing.push(data);
        created += 1;
      }
      setMessage(
        `${created} cadence assignment${created === 1 ? "" : "s"} copied.`,
      );
    } catch (error) {
      setMessage(error.message || "Unable to copy cadence.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ContentCopyIcon color="primary" /> {t("title")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={sections}
            value={source}
            onChange={(_, value) => {
              setSource(value);
              setAssignments([]);
            }}
            getOptionLabel={(option) => option?.name || ""}
            renderInput={(params) => (
              <TextField {...params} label={t("copyFromClass")} />
            )}
          />
          <Autocomplete
            multiple
            options={sections.filter((section) => section.id !== source?.id)}
            value={targets}
            onChange={(_, value) => setTargets(value)}
            getOptionLabel={(option) => option?.name || ""}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={t("copyToClasses")} />
            )}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              type="date"
              label={t("firstMeetingDate")}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="number"
              label={t("weeksLabel")}
              value={weeks}
              onChange={(event) => setWeeks(event.target.value)}
              inputProps={{ min: 1, max: 52 }}
            />
            <TextField
              type="number"
              label={t("weeklyMeetingLabel")}
              value={weeklyMeetingNumber}
              onChange={(event) => setWeeklyMeetingNumber(event.target.value)}
              inputProps={{ min: 0, max: 20 }}
              helperText={t("weeklyMeetingHint")}
            />
          </Box>
          <TimingPatternPicker
            value={timingPattern}
            onChange={setTimingPattern}
            disabled={saving}
          />
          {loading && (
            <Typography color="text.secondary">
              {t("loadingCadence")}
            </Typography>
          )}
          {!loading && source && assignments.length === 0 && (
            <Alert severity="info">{t("noAssignments")}</Alert>
          )}
          {!loading && source && assignmentsWithoutMetadata.length > 0 && (
            <Alert severity="warning">
              {assignmentsWithoutMetadata.length} {t("missingMetadata")}
            </Alert>
          )}
          {preview.length > 0 && (
            <Box sx={{ height: 560, minHeight: 420 }}>
              <Suspense
                fallback={
                  <Skeleton variant="rectangular" width="100%" height={500} />
                }
              >
                <EventCalendar
                  events={calendarEvents}
                  defaultView="week"
                  views={["week", "month"]}
                  defaultPreferences={{ isSidePanelOpen: false }}
                  sx={{ height: "100%" }}
                />
              </Suspense>
              <Box sx={{ maxHeight: 180, overflow: "auto", mt: 1 }}>
                {preview.map(
                  ({ target, item, date, week, weeklyMeetingIndex }, index) => (
                    <Typography
                      key={`${target.id}-${item.assignment.id}-${index}`}
                      variant="body2"
                    >
                      Week {week}
                      {item.meetingIndex !== null
                        ? `, meeting ${item.meetingIndex + 1}`
                        : `, meeting ${weeklyMeetingIndex + 1}`}
                      :{" "}
                      {item.assignment.unitID
                        ? units.find(
                            (unit) => unit.id === item.assignment.unitID,
                          )?.name || item.assignment.unitID
                        : "Open slot"}{" "}
                      → {target.name} ({date.toLocaleDateString()})
                    </Typography>
                  ),
                )}
              </Box>
            </Box>
          )}
          {message && (
            <Alert severity={message.includes("Unable") ? "error" : "success"}>
              {message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          disabled={
            saving ||
            loading ||
            !source ||
            targets.length === 0 ||
            preview.length === 0 ||
            assignmentsWithoutMetadata.length > 0
          }
          startIcon={<ContentCopyIcon />}
        >
          {saving ? t("copying") : t("copyCadence")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
