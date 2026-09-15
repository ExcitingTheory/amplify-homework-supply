"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Checkbox,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { getAmplifyClient } from "@/utils/amplifyClient";

const DAY_MS = 24 * 60 * 60 * 1000;

// Shift an ISO datetime by a whole number of days; returns null when absent.
function shiftIso(iso, days) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + days * DAY_MS).toISOString();
}

/**
 * BulkDueDateDialog: multi-select assignments and either shift their due dates
 * by a number of days (preserving each timing window) or set an absolute date.
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - assignments: Assignment[]   // visible/candidate assignments for the section
 *   - getUnitName: (unitID) => string
 *   - onUpdated: () => void       // called after successful updates (to refetch)
 */
export function BulkDueDateDialog({
  open,
  onClose,
  assignments = [],
  getUnitName,
  onUpdated,
}) {
  const t = useTranslations();
  const [selected, setSelected] = React.useState(() => new Set());
  const [mode, setMode] = React.useState("shift");
  const [shiftDays, setShiftDays] = React.useState("7");
  const [absoluteDate, setAbsoluteDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const candidates = React.useMemo(
    () => assignments.filter((a) => a != null && a.id != null),
    [assignments],
  );

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setMode("shift");
    setShiftDays("7");
    setAbsoluteDate("");
    setError("");
  }, [open]);

  const toggle = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) =>
      current.size === candidates.length
        ? new Set()
        : new Set(candidates.map((a) => a.id)),
    );
  };

  const canApply =
    selected.size > 0 &&
    (mode === "shift"
      ? Number.isFinite(Number(shiftDays)) && Number(shiftDays) !== 0
      : !!absoluteDate);

  const handleApply = async () => {
    if (!canApply) return;
    setSaving(true);
    setError("");
    try {
      const client = getAmplifyClient();
      const targets = candidates.filter((a) => selected.has(a.id));
      const days = Number(shiftDays);
      const absoluteIso = absoluteDate
        ? new Date(absoluteDate).toISOString()
        : null;

      const results = await Promise.allSettled(
        targets.map((assignment) => {
          let update;
          if (mode === "shift") {
            update = {
              id: assignment.id,
              _version: assignment._version,
              dueDate: shiftIso(assignment.dueDate, days),
            };
            const shiftedFrom = shiftIso(assignment.availableFrom, days);
            const shiftedUntil = shiftIso(assignment.availableUntil, days);
            const shiftedUnlock = shiftIso(assignment.unlockDate, days);
            if (shiftedFrom) update.availableFrom = shiftedFrom;
            if (shiftedUntil) update.availableUntil = shiftedUntil;
            if (shiftedUnlock) update.unlockDate = shiftedUnlock;
          } else {
            update = {
              id: assignment.id,
              _version: assignment._version,
              dueDate: absoluteIso,
            };
            // Keep the closing edge of the availability window aligned with the due date.
            if (assignment.availableUntil) update.availableUntil = absoluteIso;
          }
          return client.models.Assignment.update(update);
        }),
      );

      const failures = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.value && r.value.errors && r.value.errors.length > 0),
      );
      if (failures.length > 0) {
        setError(
          t("sectionDetail.bulkDueDatePartial", {
            failed: failures.length,
            total: targets.length,
            defaultValue: `${failures.length} of ${targets.length} updates failed`,
          }),
        );
      }
      if (failures.length < targets.length) {
        onUpdated?.();
      }
      if (failures.length === 0) {
        onClose?.();
      }
    } catch (err) {
      setError(err?.message || "Failed to update due dates");
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (a) => getUnitName?.(a.unitID) || a.unitID || "Assignment";

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {t("sectionDetail.bulkDueDateTitle", "Shift assignment due dates")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "sectionDetail.bulkDueDateHelp",
            "Select assignments, then shift their due dates by a number of days or set a new date for all of them.",
          )}
        </DialogContentText>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_e, next) => next && setMode(next)}
          >
            <ToggleButton value="shift">
              {t("sectionDetail.bulkDueDateShiftMode", "Shift by days")}
            </ToggleButton>
            <ToggleButton value="set">
              {t("sectionDetail.bulkDueDateSetMode", "Set date")}
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === "shift" ? (
            <TextField
              size="small"
              type="number"
              label={t("sectionDetail.bulkDueDateDays", "Days (+/-)")}
              value={shiftDays}
              onChange={(e) => setShiftDays(e.target.value)}
              sx={{ width: 130 }}
            />
          ) : (
            <TextField
              size="small"
              type="datetime-local"
              label={t("sectionDetail.bulkDueDateNewDate", "New due date")}
              value={absoluteDate}
              onChange={(e) => setAbsoluteDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 230 }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxHeight: 320 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      candidates.length > 0 &&
                      selected.size === candidates.length
                    }
                    indeterminate={
                      selected.size > 0 && selected.size < candidates.length
                    }
                    onChange={toggleAll}
                    inputProps={{
                      "aria-label": t(
                        "sectionDetail.bulkDueDateSelectAll",
                        "Select all assignments",
                      ),
                    }}
                  />
                </TableCell>
                <TableCell>
                  {t("sectionDetail.bulkDueDateUnit", "Unit")}
                </TableCell>
                <TableCell align="right">
                  {t("sectionDetail.bulkDueDateCurrent", "Current due")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.map((a) => (
                <TableRow key={a.id} hover selected={selected.has(a.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {nameOf(a)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {a.dueDate
                        ? new Date(a.dueDate).toLocaleString()
                        : t("sectionDetail.noDueDate", "No due date")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      {t(
                        "sectionDetail.bulkDueDateNone",
                        "No assignments available.",
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
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!canApply || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {t("sectionDetail.bulkDueDateApply", {
            count: selected.size,
            defaultValue: `Update ${selected.size || ""}`.trim(),
          })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BulkDueDateDialog;
