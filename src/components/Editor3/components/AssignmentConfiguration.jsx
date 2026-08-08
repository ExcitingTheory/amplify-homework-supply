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
} from "@mui/material";
import SectionContext from "../../../context/sectionContext";
import UnitContext from "../../../context/unitContext";
import TimerEditor from "./TimerEditor";

export default function AssignmentConfiguration() {
  const t = useTranslations("editor.authoring");

  const { sections, sectionMap, assignments } =
    React.useContext(SectionContext);

  const { unit } = React.useContext(UnitContext);

  const [selectedSections, setSelectedSections] = React.useState([]);
  const [dueDate, setDueDate] = React.useState("");
  const [retryEnabled, setRetryEnabled] = React.useState(
    unit?.retryEnabled || false,
  );
  const lastWrittenVersionRef = React.useRef(0);

  React.useEffect(() => {
    // Skip sync until context catches up to the version we wrote
    if (unit?._version < lastWrittenVersionRef.current) return;
    lastWrittenVersionRef.current = 0;
    setRetryEnabled(unit?.retryEnabled || false);
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
  };

  // Filter out sections that already have assignments
  const allSections = React.useMemo(() => {
    if (!sections?.length) return [];
    return sections.filter((s) => s != null && s.id != null);
  }, [sections]);

  const assignedSectionIds = React.useMemo(() => {
    return new Set(assignments?.map((a) => a.sectionID) || []);
  }, [assignments]);

  const createAssignments = React.useCallback(
    async (sectionIds, dueDateISO) => {
      if (!sectionIds?.length || !dueDateISO || !unit?.id) return;

      const client = getAmplifyClient();
      const learners = [...(unit.learners || [])];
      let learnersChanged = false;

      for (const sectionId of sectionIds) {
        // Don't create duplicate assignment for same section
        if (assignments?.some((a) => a.sectionID === sectionId)) continue;

        const assignment = {
          unitID: unit.id,
          sectionID: sectionId,
          learner: sectionMap[sectionId]?.learner,
          dueDate: dueDateISO,
        };

        await client.models.Assignment.create(assignment);

        // add to the dynamic group list if it doesn't exist
        if (
          sectionMap[sectionId]?.learner &&
          !learners.includes(sectionMap[sectionId].learner)
        ) {
          learners.push(sectionMap[sectionId].learner);
          learnersChanged = true;
        }
      }

      if (learnersChanged) {
        await client.models.Unit.update({
          id: unit.id,
          learners: learners,
        });
      }

      // Reset fields after successful save
      setSelectedSections([]);
      setDueDate("");
    },
    [unit?.id, unit?.learners, sectionMap, assignments],
  );

  // Auto-save assignments when both fields are filled
  React.useEffect(() => {
    if (selectedSections.length > 0 && dueDate) {
      createAssignments(
        selectedSections.map((s) => s.id),
        dueDate,
      );
    }
  }, [selectedSections, dueDate, createAssignments]);

  const deleteAssignment = async (assignment) => {
    console.log("deleteAssignment", assignment);
    const client = getAmplifyClient();
    await client.models.Assignment.delete({ id: assignment.id });
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
        <TextField
          sx={{ margin: "1rem" }}
          id="datetime-local"
          data-tour="due-date-picker"
          label={t("assignmentConfiguration.dueDateLabel")}
          type="datetime-local"
          value={dueDate ? new Date(dueDate).toISOString().slice(0, 16) : ""}
          slotProps={{
            inputLabel: { shrink: true },
          }}
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
            onChange={(event, newValue) => setSelectedSections(newValue)}
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
    </>
  );
}
