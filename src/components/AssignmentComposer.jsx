"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "@/utils/amplifyClient";
import UnitContext from "@/context/unitContext";
import SectionContext from "@/context/sectionContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Alert,
  Snackbar,
  Chip,
  TextField,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UndoIcon from "@mui/icons-material/Undo";
import { getNextClassDate } from "@/utils/classSchedule";
import {
  BUILT_IN_TIMING_PATTERNS,
  resolveTimingWindow,
} from "@/utils/assignmentTiming";
import { TimingPatternPicker } from "@/components/TimingPatternPicker";

/**
 * AssignmentComposer: Reusable component for creating assignments
 * Can be used in dialogs (section cards) or inline (section detail)
 *
 * Props:
 *   - open: boolean - is dialog open
 *   - onClose: function - close handler
 *   - selectedUnit?: Unit object - pre-selected unit
 *   - selectedSectionIds?: string[] - pre-selected section IDs
 *   - units: Unit[] - available units to assign
 *   - sections: Section[] - available sections
 *   - onSuccess?: function - callback after successful assignment
 */
export function AssignmentComposer({
  open,
  onClose,
  selectedUnit,
  selectedSectionIds = [],
  units = [],
  sections = [],
  onSuccess,
  inline = false,
}) {
  const t = useTranslations();
  const [unit, setUnit] = useState(selectedUnit || null);
  const [selectedSections, setSelectedSections] = useState(
    selectedSectionIds || [],
  );
  const [dueDate, setDueDate] = useState("");
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [publishFirst, setPublishFirst] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastCreatedAssignments, setLastCreatedAssignments] = useState([]);
  const [undoSnackbarOpen, setUndoSnackbarOpen] = useState(false);
  const [locallyCreatedSections, setLocallyCreatedSections] = useState([]);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);
  const [timingPattern, setTimingPattern] = useState(
    BUILT_IN_TIMING_PATTERNS[0],
  );

  // Merge server-provided sections with any created inline before the parent's
  // subscription has had a chance to refresh its own `sections` prop.
  const sectionOptions = useMemo(() => {
    const map = new Map();
    [...sections, ...locallyCreatedSections].forEach((s) => {
      if (s?.id) map.set(s.id, s);
    });
    return Array.from(map.values());
  }, [sections, locallyCreatedSections]);

  const handleCreateSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    setCreatingSection(true);
    try {
      const client = getAmplifyClient();
      const { data: newSection, errors } = await client.models.Section.create({
        name,
      });
      if (errors?.length)
        throw new Error(errors[0]?.message || "Failed to create section");
      if (newSection) {
        setLocallyCreatedSections((prev) => [...prev, newSection]);
        setSelectedSections((prev) => [...prev, newSection]);
      }
      setNewSectionName("");
      setNewSectionOpen(false);
    } catch (error) {
      console.error("Error creating section:", error);
    } finally {
      setCreatingSection(false);
    }
  };

  const getQuickDueDate = useCallback(
    (type) => {
      const now = new Date();
      let date;

      if (type === "tomorrow") {
        date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        date.setHours(23, 59, 0, 0);
      } else if (type === "nextClass") {
        date = getNextClassDate(selectedSections, sections, now);
      } else if (type === "friday") {
        const dayOfWeek = now.getDay();
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
        date = new Date(now.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
        date.setHours(23, 59, 0, 0);
      }

      return date.toISOString().split("T")[0];
    },
    [selectedSections, sections],
  );

  const handleQuickDueDate = (type) => {
    setDueDate(getQuickDueDate(type));
  };

  React.useEffect(() => {
    if (!selectedSections.length) {
      setStudentOptions([]);
      if (selectedStudentId) setSelectedStudentId(null);
      return;
    }

    const allStudents = selectedSections.flatMap((sectionRef) => {
      const section =
        typeof sectionRef === "string"
          ? sectionOptions.find((item) => item.id === sectionRef)
          : sectionRef;
      return Array.isArray(section?.students) ? section.students : [];
    });
    const uniqueStudents = Array.from(
      new Map(
        allStudents
          .filter(Boolean)
          .map((student) => [
            student.id || student.studentId || student.username,
            student,
          ]),
      ).values(),
    );
    setStudentOptions(uniqueStudents);

    if (
      selectedStudentId &&
      !uniqueStudents.some((student) => {
        const candidateId = student.id || student.studentId || student.username;
        return candidateId === selectedStudentId;
      })
    ) {
      setSelectedStudentId(null);
    }
  }, [selectedSections, selectedStudentId, sectionOptions]);

  const createAssignments = async () => {
    if (!unit || selectedSections.length === 0 || !dueDate) {
      console.warn("Missing required fields");
      return;
    }

    setCreating(true);
    try {
      const client = getAmplifyClient();
      const createdIds = [];
      const dueDateISO = dueDate;

      // Handle publish first if needed
      if (publishFirst && unit.status !== "PUBLISHED") {
        await client.models.Unit.update({
          id: unit.id,
          status: "PUBLISHED",
          _version: unit._version,
        });
      }

      // Create assignments for each selected section
      for (const sectionRef of selectedSections) {
        const sectionId =
          typeof sectionRef === "string" ? sectionRef : sectionRef?.id;
        if (!sectionId) continue;
        const section = sections.find((item) => item?.id === sectionId);
        const timingWindow = resolveTimingWindow(
          timingPattern,
          dueDateISO,
          section?.classSchedule || [],
        );
        const assignment = await client.models.Assignment.create({
          unitID: unit.id,
          sectionID: sectionId,
          studentID: selectedStudentId || undefined,
          dueDate: timingWindow.availableUntil.toISOString(),
          availableFrom: timingWindow.availableFrom.toISOString(),
          availableUntil: timingWindow.availableUntil.toISOString(),
          allowLateCompletion: timingWindow.allowLateCompletion,
          timingPatternId: timingPattern.id,
          retryEnabled,
        });

        if (assignment?.id) {
          createdIds.push(assignment.id);
        }

        // Update Unit.learners group to include this section's students
        if (section && section.students) {
          const currentLearners = unit.learners || [];
          const newLearners = Array.from(
            new Set([...currentLearners, ...section.students]),
          );

          await client.models.Unit.update({
            id: unit.id,
            learners: newLearners,
            _version: unit._version,
          });
        }
      }

      setLastCreatedAssignments(createdIds);
      setUndoSnackbarOpen(true);

      // Reset form
      setUnit(selectedUnit || null);
      setSelectedSections(selectedSectionIds || []);
      setDueDate("");
      setRetryEnabled(true);
      setPublishFirst(false);

      if (onSuccess) {
        onSuccess(createdIds);
      }

      onClose?.();
    } catch (error) {
      console.error("Error creating assignments:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleUndoLastAssignments = async () => {
    if (lastCreatedAssignments.length === 0) return;

    try {
      const client = getAmplifyClient();
      for (const assignmentId of lastCreatedAssignments) {
        const assignment = await client.models.Assignment.observeQuery({
          filter: { id: { eq: assignmentId } },
        })
          .toPromise()
          .then((result) => result.items?.[0]);

        if (assignment) {
          await client.models.Assignment.delete({
            id: assignmentId,
            _version: assignment._version,
          });
        }
      }

      setLastCreatedAssignments([]);
      setUndoSnackbarOpen(false);
    } catch (error) {
      console.error("Error undoing assignments:", error);
    }
  };

  if (inline) {
    // Inline version — shown directly in section detail
    return (
      <Box
        sx={{
          mb: 3,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t("assignmentComposer.assignUnit", "Assign Unit")}
        </Typography>

        <Stack spacing={2}>
          <Autocomplete
            options={units}
            getOptionLabel={(option) => option?.name || ""}
            value={unit}
            onChange={(e, newValue) => setUnit(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("assignmentComposer.selectUnit", "Select Unit")}
              />
            )}
            disabled={creating}
          />

          <Autocomplete
            multiple
            options={sectionOptions}
            getOptionLabel={(option) => option?.name || ""}
            value={selectedSections}
            onChange={(e, newValue) => setSelectedSections(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t(
                  "assignmentComposer.selectSections",
                  "Select Sections",
                )}
              />
            )}
            disabled={creating}
          />

          {!newSectionOpen ? (
            <Button
              size="small"
              variant="text"
              startIcon={<AddIcon />}
              onClick={() => setNewSectionOpen(true)}
              disabled={creating}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("assignmentComposer.createNewSection", "Create new section")}
            </Button>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                autoFocus
                label={t("assignmentComposer.newSectionName", "Section name")}
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                disabled={creatingSection}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={handleCreateSection}
                disabled={creatingSection || !newSectionName.trim()}
              >
                {creatingSection
                  ? t("common.creating", "Creating...")
                  : t("common.create", "Create")}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setNewSectionOpen(false);
                  setNewSectionName("");
                }}
                disabled={creatingSection}
              >
                {t("common.cancel", "Cancel")}
              </Button>
            </Stack>
          )}

          <TextField
            label={t("assignmentComposer.dueDate", "Due Date")}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={creating}
          />

          {/* Quick due-date chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={t("assignmentComposer.tomorrow", "Tomorrow")}
              onClick={() => handleQuickDueDate("tomorrow")}
              variant="outlined"
              disabled={creating}
            />
            <Chip
              label={t("assignmentComposer.nextClass", "Next class")}
              onClick={() => handleQuickDueDate("nextClass")}
              variant="outlined"
              disabled={creating}
            />
            <Chip
              label={t("assignmentComposer.friday", "Friday")}
              onClick={() => handleQuickDueDate("friday")}
              variant="outlined"
              disabled={creating}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={retryEnabled}
                onChange={(e) => setRetryEnabled(e.target.checked)}
                disabled={creating}
              />
            }
            label={t("assignmentComposer.allowRetry", "Allow Retries")}
          />

          {unit?.status !== "PUBLISHED" && (
            <FormControlLabel
              control={
                <Switch
                  checked={publishFirst}
                  onChange={(e) => setPublishFirst(e.target.checked)}
                  disabled={creating}
                />
              }
              label={t("assignmentComposer.publishFirst", "Publish Unit First")}
            />
          )}

          {/* Assignment preview */}
          {selectedSections.length > 0 && dueDate && (
            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("assignmentComposer.assigningTo", "Assigning to:")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {selectedSections.map((section) => (
                  <Chip
                    key={section.id}
                    label={`${section.name} - Due ${dueDate}`}
                    size="small"
                  />
                ))}
              </Box>
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={onClose} disabled={creating} variant="outlined">
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={createAssignments}
              disabled={
                creating || !unit || selectedSections.length === 0 || !dueDate
              }
              variant="contained"
              startIcon={<AddIcon />}
            >
              {creating
                ? t("common.assigning", "Assigning...")
                : t("assignmentComposer.assign", "Assign")}
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  // Dialog version
  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t("assignmentComposer.assignUnit", "Assign Unit")}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Autocomplete
              options={units}
              getOptionLabel={(option) => option?.name || ""}
              value={unit}
              onChange={(e, newValue) => setUnit(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("assignmentComposer.selectUnit", "Select Unit")}
                />
              )}
              disabled={creating}
            />

            <Autocomplete
              multiple
              options={sectionOptions}
              getOptionLabel={(option) => option?.name || ""}
              value={selectedSections}
              onChange={(e, newValue) => setSelectedSections(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t(
                    "assignmentComposer.selectSections",
                    "Select Sections",
                  )}
                />
              )}
              disabled={creating}
            />

            {!newSectionOpen ? (
              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => setNewSectionOpen(true)}
                disabled={creating}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("assignmentComposer.createNewSection", "Create new section")}
              </Button>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  autoFocus
                  label={t("assignmentComposer.newSectionName", "Section name")}
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  disabled={creatingSection}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCreateSection}
                  disabled={creatingSection || !newSectionName.trim()}
                >
                  {creatingSection
                    ? t("common.creating", "Creating...")
                    : t("common.create", "Create")}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setNewSectionOpen(false);
                    setNewSectionName("");
                  }}
                  disabled={creatingSection}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
              </Stack>
            )}

            <TextField
              label={t("assignmentComposer.dueDate", "Due Date")}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={creating}
            />

            <TimingPatternPicker
              value={timingPattern}
              onChange={setTimingPattern}
              disabled={creating}
            />

            <TimingPatternPicker
              value={timingPattern}
              onChange={setTimingPattern}
              disabled={creating}
            />

            <Autocomplete
              options={[
                { id: "all", name: "Whole section" },
                ...studentOptions,
              ]}
              getOptionLabel={(option) =>
                option?.name ||
                option?.displayName ||
                (option?.id === "all" ? "Whole section" : option?.id || "")
              }
              value={
                selectedStudentId
                  ? studentOptions.find((student) => {
                      const candidateId =
                        student.id || student.studentId || student.username;
                      return candidateId === selectedStudentId;
                    }) || { id: selectedStudentId, name: selectedStudentId }
                  : { id: "all", name: "Whole section" }
              }
              onChange={(_, nextValue) => {
                setSelectedStudentId(
                  nextValue && nextValue.id !== "all"
                    ? nextValue.id || nextValue.studentId || nextValue.username
                    : null,
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t(
                    "assignmentComposer.targetStudent",
                    "Target student",
                  )}
                />
              )}
              disabled={creating || !selectedSections.length}
              isOptionEqualToValue={(option, value) =>
                (option?.id || option?.studentId || option?.username) ===
                (value?.id || value?.studentId || value?.username)
              }
            />

            {/* Quick due-date chips */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={t("assignmentComposer.tomorrow", "Tomorrow")}
                onClick={() => handleQuickDueDate("tomorrow")}
                variant="outlined"
                disabled={creating}
              />
              <Chip
                label={t("assignmentComposer.nextClass", "Next class")}
                onClick={() => handleQuickDueDate("nextClass")}
                variant="outlined"
                disabled={creating}
              />
              <Chip
                label={t("assignmentComposer.friday", "Friday")}
                onClick={() => handleQuickDueDate("friday")}
                variant="outlined"
                disabled={creating}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={retryEnabled}
                  onChange={(e) => setRetryEnabled(e.target.checked)}
                  disabled={creating}
                />
              }
              label={t("assignmentComposer.allowRetry", "Allow Retries")}
            />

            {unit?.status !== "PUBLISHED" && (
              <FormControlLabel
                control={
                  <Switch
                    checked={publishFirst}
                    onChange={(e) => setPublishFirst(e.target.checked)}
                    disabled={creating}
                  />
                }
                label={t(
                  "assignmentComposer.publishFirst",
                  "Publish Unit First",
                )}
              />
            )}

            {/* Assignment preview */}
            {selectedSections.length > 0 && dueDate && (
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t("assignmentComposer.assigningTo", "Assigning to:")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {selectedSections.map((section) => (
                    <Chip
                      key={section.id}
                      label={`${section.name} - Due ${dueDate}`}
                      size="small"
                    />
                  ))}
                </Box>
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={creating} variant="outlined">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={createAssignments}
            disabled={
              creating || !unit || selectedSections.length === 0 || !dueDate
            }
            variant="contained"
            startIcon={<AddIcon />}
          >
            {creating
              ? t("common.assigning", "Assigning...")
              : t("assignmentComposer.assign", "Assign")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Undo snackbar */}
      <Snackbar
        open={undoSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setUndoSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setUndoSnackbarOpen(false)}
          severity="success"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleUndoLastAssignments}
              startIcon={<UndoIcon />}
            >
              {t("common.undo", "Undo")}
            </Button>
          }
        >
          {t(
            "assignmentComposer.assignmentCreated",
            "Assignment created successfully",
          )}
        </Alert>
      </Snackbar>
    </>
  );
}
