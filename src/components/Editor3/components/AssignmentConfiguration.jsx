"use strict";
import React, { use } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../../../utils/amplifyClient";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Autocomplete,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
  Tooltip,
  Box,
  IconButton,
  ListItem,
  List,
  ListItemText,
  Button,
  Stack,
  Alert,
  Snackbar,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UndoIcon from "@mui/icons-material/Undo";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickerDay } from "@mui/x-date-pickers/PickerDay";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SectionContext from "../../../context/sectionContext";
import UnitContext from "../../../context/unitContext";
import TimerEditor from "./TimerEditor";
import { getNextClassDate } from "../../../utils/classSchedule";
import {
  BUILT_IN_TIMING_PATTERNS,
  resolveTimingWindow,
} from "../../../utils/assignmentTiming";
import { TimingPatternPicker } from "../../TimingPatternPicker";

function MeetingCalendar({ sections, dueDate, onSelectDate, t }) {
  const meetingDays = React.useMemo(
    () =>
      new Set(
        sections.flatMap((section) =>
          (section.classSchedule || [])
            .map((entry) => entry?.dayOfWeek)
            .filter((day) => Number.isInteger(day)),
        ),
      ),
    [sections],
  );

  const meetingDay = (props) => {
    const isMeetingDay = meetingDays.has(props.day.day());
    return (
      <Box sx={{ position: "relative" }}>
        <PickerDay
          {...props}
          sx={
            isMeetingDay
              ? { fontWeight: 700, color: "primary.main" }
              : undefined
          }
        />
        {isMeetingDay && !props.selected && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              width: 4,
              height: 4,
              borderRadius: "50%",
              bgcolor: "primary.main",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mx: 2, mb: 2, maxWidth: 360 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label={t("assignmentConfiguration.meetingCalendar", "Due date")}
          value={dueDate ? dayjs(dueDate) : null}
          onChange={(value) => {
            if (value?.isValid()) onSelectDate(value.toISOString());
          }}
          slots={{ day: meetingDay }}
          slotProps={{
            textField: { fullWidth: true, size: "small" },
          }}
        />
      </LocalizationProvider>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        {t(
          "assignmentConfiguration.meetingDayHint",
          "Dots mark section meeting days.",
        )}
      </Typography>
    </Box>
  );
}

export default function AssignmentConfiguration() {
  const t = useTranslations("editor.authoring");

  const { sections, sectionMap, assignments } =
    React.useContext(SectionContext);

  const { unit } = React.useContext(UnitContext);

  const [selectedSections, setSelectedSections] = React.useState([]);
  const [sectionDueDates, setSectionDueDates] = React.useState({});
  const [dueDate, setDueDate] = React.useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 0, 0);
    return date.toISOString();
  });
  const [retryEnabled, setRetryEnabled] = React.useState(
    unit?.retryEnabled !== false,
  );
  const [workbookChatEnabled, setWorkbookChatEnabled] = React.useState(true);
  const [aiChatEnabled, setAiChatEnabled] = React.useState(true);
  const [lastCreatedAssignments, setLastCreatedAssignments] = React.useState(
    [],
  );
  const [undoSnackbarOpen, setUndoSnackbarOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [publishFirst, setPublishFirst] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState("");
  const [creatingSection, setCreatingSection] = React.useState(false);
  const [locallyCreatedSections, setLocallyCreatedSections] = React.useState(
    [],
  );
  const [createdSection, setCreatedSection] = React.useState(null);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [timingPattern, setTimingPattern] = React.useState(
    BUILT_IN_TIMING_PATTERNS[0],
  );
  const lastWrittenVersionRef = React.useRef(0);

  React.useEffect(() => {
    // Skip sync until context catches up to the version we wrote
    if (unit?._version < lastWrittenVersionRef.current) return;
    lastWrittenVersionRef.current = 0;
    setRetryEnabled(unit?.retryEnabled !== false);
  }, [unit?.retryEnabled, unit?._version]);

  const handleRetryToggle = async (event) => {
    const checked = event.target.checked;
    setRetryEnabled(checked);
    try {
      const client = getAmplifyClient();
      const { data, errors } = await client.models.Unit.update({
        id: unit.id,
        retryEnabled: checked,
        _version: unit._version ?? 1,
      });
      if (errors?.length) {
        console.error(
          "[AssignmentConfiguration] retryEnabled update returned errors:",
          errors,
        );
        setRetryEnabled(!checked); // revert on error
      } else if (data) {
        lastWrittenVersionRef.current = data._version;
      }
    } catch (err) {
      console.error(
        "[AssignmentConfiguration] retryEnabled update threw:",
        err,
      );
      setRetryEnabled(!checked); // revert on error
    }
  };

  const handleDueDateChange = async (event) => {
    const parsed = Date.parse(event.target.value);
    if (isNaN(parsed)) return;

    const date = new Date(parsed);
    const isoDate = date.toISOString();
    console.log("ISO date:", isoDate);
    console.log("dueDate", dueDate);

    if (isoDate == dueDate) {
      return;
    }

    setDueDate(isoDate);
    setSectionDueDates((current) =>
      Object.fromEntries(
        selectedSections.map((section) => [section.id, isoDate]),
      ),
    );
  };

  // Filter out sections that already have assignments
  const allSections = React.useMemo(() => {
    const sectionById = new Map();
    [...(sections || []), ...locallyCreatedSections].forEach((section) => {
      if (section?.id) sectionById.set(section.id, section);
    });
    return Array.from(sectionById.values());
  }, [sections, locallyCreatedSections]);

  const sectionLookup = React.useMemo(() => {
    const lookup = { ...(sectionMap || {}) };
    locallyCreatedSections.forEach((section) => {
      lookup[section.id] = section;
    });
    return lookup;
  }, [sectionMap, locallyCreatedSections]);

  const assignedSectionIds = React.useMemo(() => {
    return new Set(assignments?.map((a) => a.sectionID) || []);
  }, [assignments]);

  const studentOptions = React.useMemo(() => {
    const students = selectedSections.flatMap((section) =>
      Array.isArray(section?.students) ? section.students : [],
    );
    return Array.from(
      new Map(
        students
          .filter(Boolean)
          .map((student) => [
            student.id || student.studentId || student.username,
            student,
          ]),
      ).values(),
    );
  }, [selectedSections]);

  const handleCreateSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;

    setCreatingSection(true);
    try {
      const client = getAmplifyClient();
      const { data, errors } = await client.models.Section.create({ name });
      if (errors?.length)
        throw new Error(errors[0]?.message || "Failed to create section");
      if (data) {
        setLocallyCreatedSections((current) => [...current, data]);
        setSelectedSections((current) => [...current, data]);
        setCreatedSection(data);
      }
      setNewSectionName("");
    } catch (error) {
      console.error("[AssignmentConfiguration] Error creating section:", error);
    } finally {
      setCreatingSection(false);
    }
  };

  const createAssignments = React.useCallback(
    async (sectionIds, dueDateISO) => {
      if (!sectionIds?.length || !dueDateISO || !unit?.id) return;

      setCreating(true);
      try {
        const client = getAmplifyClient();

        if (publishFirst && unit.status !== "PUBLISHED") {
          await client.models.Unit.update({
            id: unit.id,
            status: "PUBLISHED",
            _version: unit._version,
          });
        }

        const learners = [...(unit.learners || [])];
        let learnersChanged = false;
        const createdIds = [];

        for (const sectionId of sectionIds) {
          // A direct assignment may coexist with a whole-section assignment.
          if (
            assignments?.some(
              (a) =>
                a.sectionID === sectionId &&
                (a.studentID || null) === (selectedStudentId || null),
            )
          )
            continue;

          const section = sectionLookup[sectionId];
          const timingWindow = resolveTimingWindow(
            timingPattern,
            sectionDueDates[sectionId] || dueDateISO,
            section?.classSchedule || [],
          );

          const assignment = {
            unitID: unit.id,
            sectionID: sectionId,
            studentID: selectedStudentId || undefined,
            learner: section?.learner,
            dueDate: timingWindow.availableUntil.toISOString(),
            availableFrom: timingWindow.availableFrom.toISOString(),
            availableUntil: timingWindow.availableUntil.toISOString(),
            allowLateCompletion: timingWindow.allowLateCompletion,
            timingPatternId: timingPattern.id,
            workbookChatEnabled,
            aiChatEnabled,
          };

          const { data } = await client.models.Assignment.create(assignment);
          if (data?.id) {
            createdIds.push(data.id);
          }

          // add to the dynamic group list if it doesn't exist
          if (
            sectionLookup[sectionId]?.learner &&
            !learners.includes(sectionLookup[sectionId].learner)
          ) {
            learners.push(sectionLookup[sectionId].learner);
            learnersChanged = true;
          }
        }

        if (learnersChanged) {
          await client.models.Unit.update({
            id: unit.id,
            learners: learners,
            _version: unit._version,
          });
        }

        // Store created assignment IDs for potential undo
        setLastCreatedAssignments(createdIds);
        setUndoSnackbarOpen(true);

        // Reset fields after successful save
        setSelectedSections([]);
        setDueDate("");
        setSectionDueDates({});
        setPublishFirst(false);
      } catch (err) {
        console.error(
          "[AssignmentConfiguration] Error creating assignments:",
          err,
        );
      } finally {
        setCreating(false);
      }
    },
    [
      unit?.id,
      unit?.learners,
      unit?._version,
      unit?.status,
      publishFirst,
      sectionLookup,
      sectionDueDates,
      assignments,
      selectedStudentId,
      timingPattern,
      workbookChatEnabled,
      aiChatEnabled,
    ],
  );

  const deleteAssignment = async (assignment) => {
    console.log("deleteAssignment", assignment);
    const client = getAmplifyClient();
    await client.models.Assignment.delete({
      id: assignment.id,
      _version: assignment._version,
    });
  };

  const handleUndoLastAssignments = async () => {
    if (lastCreatedAssignments.length === 0) return;
    setUndoSnackbarOpen(false);
    try {
      const client = getAmplifyClient();
      for (const assignmentId of lastCreatedAssignments) {
        const assignment = assignments?.find((a) => a.id === assignmentId);
        if (assignment) {
          await client.models.Assignment.delete({
            id: assignment.id,
            _version: assignment._version,
          });
        }
      }
      setLastCreatedAssignments([]);
    } catch (err) {
      console.error(
        "[AssignmentConfiguration] Error undoing assignments:",
        err,
      );
    }
  };

  // Quick due-date options
  const getQuickDueDate = (type) => {
    const now = new Date();
    let date = new Date(now);

    if (type === "tomorrow") {
      date.setDate(date.getDate() + 1);
      date.setHours(23, 59, 0, 0);
    } else if (type === "nextClass") {
      date = getNextClassDate(selectedSections, allSections, now);
    } else if (type === "friday") {
      // Get next Friday
      const day = date.getDay();
      const daysUntilFriday = (5 - day + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntilFriday);
      date.setHours(23, 59, 0, 0);
    }

    return date.toISOString();
  };

  const handleQuickDueDate = (type) => {
    const nextDueDate = getQuickDueDate(type);
    setDueDate(nextDueDate);
    setSectionDueDates((current) =>
      Object.fromEntries(
        selectedSections.map((section) => [section.id, nextDueDate]),
      ),
    );
  };

  const handleSectionSelectionChange = (_event, nextSections) => {
    setSelectedSections(nextSections);
    setSectionDueDates((current) =>
      Object.fromEntries(
        nextSections.map((section) => [
          section.id,
          current[section.id] || dueDate,
        ]),
      ),
    );
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            padding: "1rem",
            width: "100%",
          }}
        >
          <Box
            component="h3"
            sx={{
              textWrap: "wrap",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            {t("assignmentConfiguration.addTimerQuestion")}
            <Tooltip
              title={t("assignmentConfiguration.timerDescription")}
              arrow
            >
              <HelpOutlineIcon
                fontSize="small"
                color="action"
                sx={{ cursor: "pointer" }}
              />
            </Tooltip>
          </Box>

          <TimerEditor />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Retry toggle */}
      <Box sx={{ px: 2, py: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={retryEnabled}
              onChange={handleRetryToggle}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {t(
                "assignmentConfiguration.retryEnabled",
                "Allow students to retry after completing",
              )}
              <Tooltip
                title={t(
                  "assignmentConfiguration.retryEnabledDescription",
                  'When enabled, students see a "Try Again" button on the completion screen.',
                )}
                arrow
              >
                <HelpOutlineIcon
                  fontSize="small"
                  color="action"
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          }
        />
      </Box>

      <Box sx={{ px: 2, py: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={workbookChatEnabled}
              onChange={(event) => setWorkbookChatEnabled(event.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {t(
                "assignmentConfiguration.workbookChatEnabled",
                "Allow workbook chat rooms",
              )}
              <Tooltip
                title={t(
                  "assignmentConfiguration.workbookChatEnabledDescription",
                  "When enabled, learners can open the collaborative discussion room from the workbook.",
                )}
                arrow
              >
                <HelpOutlineIcon
                  fontSize="small"
                  color="action"
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          }
        />
      </Box>

      <Box sx={{ px: 2, py: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={aiChatEnabled}
              onChange={(event) => setAiChatEnabled(event.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {t(
                "assignmentConfiguration.aiChatEnabled",
                "Allow AI chat context",
              )}
              <Tooltip
                title={t(
                  "assignmentConfiguration.aiChatEnabledDescription",
                  "When enabled, this workbook can register assignment context with the AI assistant.",
                )}
                arrow
              >
                <HelpOutlineIcon
                  fontSize="small"
                  color="action"
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          }
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Publish-first toggle — shown while the unit is still a draft */}
      {unit?.status !== "PUBLISHED" && (
        <Box sx={{ px: 2, py: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={publishFirst}
                onChange={(e) => setPublishFirst(e.target.checked)}
                color="primary"
              />
            }
            label={t(
              "assignmentConfiguration.publishFirst",
              "Publish unit before assigning",
            )}
          />
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Box
        sx={
          {
            // maxWidth: '30rem',
          }
        }
        data-tour="assignment-settings"
      >
        <Box
          component="h3"
          sx={{
            margin: "1rem 1rem 0rem 1rem",
            textWrap: "wrap",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {t("assignmentConfiguration.assignDueDateQuestion")}
          <Tooltip
            title={`${t("assignmentConfiguration.dueDateDescriptionLine1")} ${t("assignmentConfiguration.dueDateDescriptionLine2")}`}
            arrow
          >
            <HelpOutlineIcon
              fontSize="small"
              color="action"
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        </Box>

        {/* Quick due-date chips */}
        <Box sx={{ margin: "1rem", display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={t("assignmentConfiguration.dueDateTomorrow", "Tomorrow")}
            onClick={() => handleQuickDueDate("tomorrow")}
            variant={
              dueDate === getQuickDueDate("tomorrow") ? "filled" : "outlined"
            }
            color={
              dueDate === getQuickDueDate("tomorrow") ? "primary" : "default"
            }
          />
          <Chip
            label={t("assignmentConfiguration.dueDateNextClass", "Next class")}
            onClick={() => handleQuickDueDate("nextClass")}
            variant={
              dueDate === getQuickDueDate("nextClass") ? "filled" : "outlined"
            }
            color={
              dueDate === getQuickDueDate("nextClass") ? "primary" : "default"
            }
          />
          <Chip
            label={t("assignmentConfiguration.dueDateFriday", "Friday")}
            onClick={() => handleQuickDueDate("friday")}
            variant={
              dueDate === getQuickDueDate("friday") ? "filled" : "outlined"
            }
            color={
              dueDate === getQuickDueDate("friday") ? "primary" : "default"
            }
          />
        </Box>

        <MeetingCalendar
          sections={selectedSections}
          dueDate={dueDate}
          onSelectDate={(nextDate) => {
            setDueDate(nextDate);
            setSectionDueDates((current) =>
              Object.fromEntries(
                selectedSections.map((section) => [section.id, nextDate]),
              ),
            );
          }}
          t={t}
        />

        <Box sx={{ mx: 2, mb: 2 }}>
          <TimingPatternPicker
            value={timingPattern}
            onChange={setTimingPattern}
            disabled={creating}
          />
        </Box>

        <TextField
          sx={{ margin: "1rem" }}
          id="datetime-local"
          data-tour="due-date-picker"
          label={t("assignmentConfiguration.dueDateLabel")}
          type="datetime-local"
          value={dueDate ? new Date(dueDate).toISOString().slice(0, 16) : ""}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={handleDueDateChange}
        />

        <br />

        <FormControl sx={{ margin: "1rem", minWidth: 250 }}>
          <Autocomplete
            multiple
            id="section-select-helper"
            data-tour="unit-selector"
            options={allSections}
            value={selectedSections}
            onChange={handleSectionSelectionChange}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionDisabled={(option) => assignedSectionIds.has(option.id)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.name}
                  </Box>
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: "0.8rem",
                      color: "text.secondary",
                    }}
                  >
                    {option.description}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("assignmentConfiguration.sectionLabel")}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          />
          <FormHelperText>
            {t("assignmentConfiguration.selectSectionHelper")}
          </FormHelperText>
        </FormControl>

        <FormControl sx={{ margin: "1rem", minWidth: 250 }}>
          <Autocomplete
            options={[{ id: "all", name: "Whole section" }, ...studentOptions]}
            value={
              selectedStudentId
                ? studentOptions.find(
                    (student) =>
                      (student.id || student.studentId || student.username) ===
                      selectedStudentId,
                  ) || null
                : { id: "all", name: "Whole section" }
            }
            onChange={(_, nextValue) =>
              setSelectedStudentId(
                nextValue?.id === "all"
                  ? null
                  : nextValue?.id ||
                      nextValue?.studentId ||
                      nextValue?.username ||
                      null,
              )
            }
            getOptionLabel={(option) =>
              option?.name ||
              option?.displayName ||
              option?.username ||
              option?.id ||
              ""
            }
            isOptionEqualToValue={(option, value) =>
              (option?.id || option?.studentId || option?.username) ===
              (value?.id || value?.studentId || value?.username)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t(
                  "assignmentConfiguration.studentLabel",
                  "Target student",
                )}
              />
            )}
            disabled={creating || selectedSections.length === 0}
          />
        </FormControl>

        <Box
          sx={{ mx: 2, mb: 1, display: "flex", gap: 1, alignItems: "center" }}
        >
          <TextField
            size="small"
            label={t(
              "assignmentConfiguration.newSectionName",
              "New section name",
            )}
            value={newSectionName}
            onChange={(event) => setNewSectionName(event.target.value)}
            disabled={creatingSection}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateSection}
            disabled={creatingSection || !newSectionName.trim()}
          >
            {creatingSection
              ? t("assignmentConfiguration.creatingSection", "Creating...")
              : t("assignmentConfiguration.createSection", "Create section")}
          </Button>
        </Box>

        {createdSection?.code && (
          <Alert severity="success" sx={{ mx: 2, mb: 2 }}>
            {t("assignmentConfiguration.sectionCreated", "Section created.")}{" "}
            {t("assignmentConfiguration.joinCode", "Join code:")}{" "}
            <strong>{createdSection.code}</strong>
            <Button
              size="small"
              href={`/section/${createdSection.id}`}
              sx={{ ml: 1 }}
            >
              {t("assignmentConfiguration.viewSection", "View section")}
            </Button>
          </Alert>
        )}

        {/* Assignment preview + Assign button */}
        {selectedSections.length > 0 && dueDate && (
          <Box
            sx={{
              margin: "1rem",
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t(
                "assignmentConfiguration.assignmentPreview",
                "Ready to assign to:",
              )}
            </Typography>
            <List sx={{ mb: 2 }}>
              {selectedSections.map((section) => (
                <ListItem
                  key={section.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{section.name}</Typography>
                    <TextField
                      size="small"
                      type="datetime-local"
                      label={t("assignmentConfiguration.dueDate", "Due")}
                      value={
                        sectionDueDates[section.id]
                          ? new Date(sectionDueDates[section.id])
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(event) => {
                        const parsed = Date.parse(event.target.value);
                        if (isNaN(parsed)) return;
                        setSectionDueDates((current) => ({
                          ...current,
                          [section.id]: new Date(parsed).toISOString(),
                        }));
                      }}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() =>
                createAssignments(
                  selectedSections.map((s) => s.id),
                  dueDate,
                )
              }
              disabled={creating}
              fullWidth
            >
              {creating
                ? t("assignmentConfiguration.assigning", "Assigning...")
                : publishFirst && unit?.status !== "PUBLISHED"
                  ? t(
                      "assignmentConfiguration.publishAndAssignButton",
                      `Publish & assign to ${selectedSections.length} section${selectedSections.length !== 1 ? "s" : ""}`,
                    )
                  : t(
                      "assignmentConfiguration.assignButton",
                      `Assign to ${selectedSections.length} section${selectedSections.length !== 1 ? "s" : ""}`,
                    )}
            </Button>
          </Box>
        )}

        {/**
         * A list of sections that are already assigned to this unit
         */}
        <Box sx={{ margin: "1rem" }} onClick={(e) => e.stopPropagation()}>
          <Box component="h4" sx={{ margin: "1rem" }}>
            {t("assignmentConfiguration.assignedToSectionsHeading")}
          </Box>
          {assignments?.length > 0 && (
            <List>
              {assignments.map((_assignment, index) => {
                const description = _assignment?.dueDate
                  ? new Date(_assignment?.dueDate).toLocaleString()
                  : t("assignmentConfiguration.noDueDateSet");

                const name =
                  sectionMap[_assignment?.sectionID]?.name ||
                  t("assignmentConfiguration.noSectionSet");
                return (
                  <ListItem
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                    }}
                  >
                    <ListItemText
                      primary={name}
                      secondary={description}
                      sx={{ flex: 1, minWidth: 0 }}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                    <IconButton
                      onClick={() => deleteAssignment(_assignment)}
                      color="inherit"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Undo snackbar for last created assignments */}
      <Snackbar
        open={undoSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setUndoSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setUndoSnackbarOpen(false)}
          severity="success"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<UndoIcon />}
              onClick={handleUndoLastAssignments}
            >
              {t("assignmentConfiguration.undo", "Undo")}
            </Button>
          }
          sx={{ width: "100%" }}
        >
          {t(
            "assignmentConfiguration.assignmentSuccess",
            "Assignment created successfully",
          )}
        </Alert>
      </Snackbar>
    </>
  );
}
