"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TextField,
  Checkbox,
  Typography,
} from "@mui/material";
import { hasAccommodation } from "../../utils/accommodations";

const clampDays = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 60);
};

const clampMult = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 1) return 1;
  return Math.min(n, 5);
};

/**
 * AccommodationsDialog: edit per-student due-date extensions and time multipliers
 * for a section, with an optional bulk-apply bar for multi-student edits.
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - students: Array<{ id, name, email }>
 *   - accommodations: Record<studentId, { dueDateExtensionDays?, timeMultiplier?, note?, updatedAt? }>
 *   - onSave: (nextAccommodations) => Promise<void> | void
 *   - formatName?: (student) => string
 */
export function AccommodationsDialog({
  open,
  onClose,
  students = [],
  accommodations = {},
  onSave,
  formatName,
}) {
  const t = useTranslations();
  const [draft, setDraft] = React.useState({});
  const [selected, setSelected] = React.useState(() => new Set());
  const [saving, setSaving] = React.useState(false);
  const [bulkDays, setBulkDays] = React.useState("");
  const [bulkMult, setBulkMult] = React.useState("");

  // Reset draft whenever the dialog opens with fresh data
  React.useEffect(() => {
    if (!open) return;
    setDraft(JSON.parse(JSON.stringify(accommodations || {})));
    setSelected(new Set());
    setBulkDays("");
    setBulkMult("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const entryFor = (studentId) => draft[studentId] || {};

  const updateEntry = (studentId, patch) => {
    setDraft((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || {}), ...patch },
    }));
  };

  const toggle = (studentId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) =>
      current.size === students.length
        ? new Set()
        : new Set(students.map((s) => s.id)),
    );
  };

  const applyBulk = () => {
    if (selected.size === 0) return;
    const patch = {};
    if (bulkDays !== "") patch.dueDateExtensionDays = clampDays(bulkDays);
    if (bulkMult !== "") patch.timeMultiplier = clampMult(bulkMult);
    if (Object.keys(patch).length === 0) return;
    setDraft((current) => {
      const next = { ...current };
      selected.forEach((id) => {
        next[id] = { ...(next[id] || {}), ...patch };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextAccommodations = {};
      const now = new Date().toISOString();
      students.forEach((student) => {
        const entry = draft[student.id];
        if (!entry) return;
        const normalized = {
          dueDateExtensionDays: clampDays(entry.dueDateExtensionDays),
          timeMultiplier: clampMult(entry.timeMultiplier),
          note: (entry.note || "").trim(),
        };
        if (hasAccommodation(normalized)) {
          const prev = accommodations?.[student.id] || {};
          const changed =
            prev.dueDateExtensionDays !== normalized.dueDateExtensionDays ||
            prev.timeMultiplier !== normalized.timeMultiplier ||
            (prev.note || "") !== normalized.note;
          nextAccommodations[student.id] = {
            ...normalized,
            updatedAt: changed ? now : prev.updatedAt || now,
          };
        }
      });
      await onSave?.(nextAccommodations);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (student) =>
    formatName?.(student) || student.name || student.email || student.id;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {t("sectionDetail.accommodationsTitle", "Student accommodations")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "sectionDetail.accommodationsHelp",
            "Extra days extend every assignment due date for that student. The time multiplier scales timed-assignment allowances (e.g. 1.5 = 150%).",
          )}
        </DialogContentText>

        {selected.size > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              p: 1.5,
              mb: 1.5,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("sectionDetail.accommodationsBulk", {
                count: selected.size,
                defaultValue: `Apply to ${selected.size} selected:`,
              })}
            </Typography>
            <TextField
              size="small"
              type="number"
              label={t("sectionDetail.accommodationsExtraDays", "Extra days")}
              value={bulkDays}
              onChange={(e) => setBulkDays(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ min: 0, max: 60 }}
            />
            <TextField
              size="small"
              type="number"
              label={t("sectionDetail.accommodationsMultiplier", "Time ×")}
              value={bulkMult}
              onChange={(e) => setBulkMult(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ min: 1, max: 5, step: 0.25 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={applyBulk}
              disabled={bulkDays === "" && bulkMult === ""}
            >
              {t("sectionDetail.accommodationsApply", "Apply")}
            </Button>
          </Box>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      students.length > 0 && selected.size === students.length
                    }
                    indeterminate={
                      selected.size > 0 && selected.size < students.length
                    }
                    onChange={toggleAll}
                    inputProps={{
                      "aria-label": t(
                        "sectionDetail.accommodationsSelectAll",
                        "Select all students",
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  {t("sectionDetail.studentHeader", "Student")}
                </TableCell>
                <TableCell align="right" sx={{ width: 120 }}>
                  {t("sectionDetail.accommodationsExtraDays", "Extra days")}
                </TableCell>
                <TableCell align="right" sx={{ width: 120 }}>
                  {t("sectionDetail.accommodationsMultiplier", "Time ×")}
                </TableCell>
                <TableCell sx={{ minWidth: 160 }}>
                  {t("sectionDetail.accommodationsNote", "Note")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const entry = entryFor(student.id);
                return (
                  <TableRow
                    key={student.id}
                    hover
                    selected={selected.has(student.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(student.id)}
                        onChange={() => toggle(student.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{nameOf(student)}</Typography>
                      {student.email && (
                        <Typography variant="caption" color="text.secondary">
                          {student.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={entry.dueDateExtensionDays ?? ""}
                        onChange={(e) =>
                          updateEntry(student.id, {
                            dueDateExtensionDays:
                              e.target.value === ""
                                ? 0
                                : clampDays(e.target.value),
                          })
                        }
                        inputProps={{
                          min: 0,
                          max: 60,
                          "aria-label": "extra days",
                        }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={entry.timeMultiplier ?? ""}
                        onChange={(e) =>
                          updateEntry(student.id, {
                            timeMultiplier:
                              e.target.value === ""
                                ? 1
                                : clampMult(e.target.value),
                          })
                        }
                        inputProps={{
                          min: 1,
                          max: 5,
                          step: 0.25,
                          "aria-label": "time multiplier",
                        }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={entry.note ?? ""}
                        onChange={(e) =>
                          updateEntry(student.id, { note: e.target.value })
                        }
                        placeholder={t(
                          "sectionDetail.accommodationsNotePlaceholder",
                          "Optional",
                        )}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      {t(
                        "sectionDetail.accommodationsNoStudents",
                        "No students in this section yet.",
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("common.actions.cancel", "Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {t("common.actions.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AccommodationsDialog;
