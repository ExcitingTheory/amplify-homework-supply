/**
 * SkillForm — Multi-field form for creating/editing skills with unit linking.
 * Replaces the previous title-only input in the instructor panel.
 *
 * @module SkillForm
 */

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

// ============================================================================
// Types
// ============================================================================

export interface UnitOption {
  id: string;
  name: string;
  /** PublishedStatus of the underlying Unit — used to flag drafts in pickers */
  status?: string;
}

export interface SkillOption {
  id: string;
  title: string;
}

export interface SkillFormData {
  title: string;
  description?: string;
  xpReward: number;
  unitIds: string[];
  prerequisites: string[];
  minimumAccuracy: number;
}

export interface SkillFormProps {
  /** Available units for linking (from section assignments) */
  availableUnits?: UnitOption[];
  /** Available skills for prerequisites */
  availableSkills?: SkillOption[];
  /** Called when form is submitted */
  onSubmit: (data: SkillFormData) => void;
  /** Called when "Generate from Unit" is clicked */
  onGenerateFromUnit?: (unitId: string) => void;
  /** Disable during submission */
  submitting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SkillForm({
  availableUnits = [],
  availableSkills = [],
  onSubmit,
  onGenerateFromUnit,
  submitting = false,
}: SkillFormProps) {
  const t = useTranslations("components");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(0);
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>([]);
  const [selectedPrereqs, setSelectedPrereqs] = useState<SkillOption[]>([]);
  const [minimumAccuracy, setMinimumAccuracy] = useState(70);
  const [generateUnit, setGenerateUnit] = useState<UnitOption | null>(null);

  const isValid = title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      xpReward,
      unitIds: selectedUnits.map((u) => u.id),
      prerequisites: selectedPrereqs.map((s) => s.id),
      minimumAccuracy,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setXpReward(0);
    setSelectedUnits([]);
    setSelectedPrereqs([]);
    setMinimumAccuracy(70);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        <TextField
          size="small"
          label={t("skillForm.titleLabel")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
          placeholder={t("skillForm.titlePlaceholder")}
          disabled={submitting}
        />

        <TextField
          size="small"
          label={t("skillForm.descriptionLabel")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          fullWidth
          placeholder={t("skillForm.descriptionPlaceholder")}
          disabled={submitting}
        />

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label={t("skillForm.xpRewardLabel")}
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {t("skillForm.xpAdornment")}
                </InputAdornment>
              ),
              inputProps: { min: 0 },
            }}
            sx={{ width: 140 }}
            disabled={submitting}
          />

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {t("skillForm.minAccuracy", { minimumAccuracy })}
            </Typography>
            <Slider
              value={minimumAccuracy}
              onChange={(_, val) => setMinimumAccuracy(val as number)}
              min={0}
              max={100}
              step={5}
              size="small"
              valueLabelDisplay="auto"
              valueLabelFormat={(val) => `${val}%`}
              disabled={submitting}
              aria-label={t("skillForm.minAccuracyLabel")}
            />
          </Box>
        </Stack>

        <Autocomplete
          multiple
          options={availableUnits}
          value={selectedUnits}
          onChange={(_, newValue) => setSelectedUnits(newValue)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <Box sx={{ flex: 1 }}>{option.name}</Box>
                {option.status === "DRAFT" && (
                  <Chip
                    label={t("skillForm.draft")}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.6rem" }}
                  />
                )}
              </Stack>
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={
                  option.status === "DRAFT"
                    ? t("skillForm.draftUnitName", { name: option.name })
                    : option.name
                }
                size="small"
                color={option.status === "DRAFT" ? "warning" : "default"}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("skillForm.requiredUnitsLabel")}
              placeholder={t("skillForm.requiredUnitsPlaceholder")}
              helperText={t("skillForm.requiredUnitsHelper")}
            />
          )}
          disabled={submitting}
          noOptionsText={t("skillForm.noUnits")}
        />

        <Autocomplete
          multiple
          options={availableSkills}
          value={selectedPrereqs}
          onChange={(_, newValue) => setSelectedPrereqs(newValue)}
          getOptionLabel={(option) => option.title}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.title}
                size="small"
                variant="outlined"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("skillForm.prerequisitesLabel")}
              placeholder={t("skillForm.prerequisitesPlaceholder")}
            />
          )}
          disabled={submitting}
          noOptionsText={t("skillForm.noSkills")}
        />

        <Stack direction="row" spacing={1}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            disabled={!isValid || submitting}
            sx={{ flex: 1 }}
          >
            {submitting ? t("skillForm.adding") : t("skillForm.addSkill")}
          </Button>

          {onGenerateFromUnit && (
            <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
              <Autocomplete
                options={availableUnits}
                value={generateUnit}
                onChange={(_, newValue) => setGenerateUnit(newValue)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{ flex: 1 }}
                    >
                      <Box sx={{ flex: 1 }}>{option.name}</Box>
                      {option.status === "DRAFT" && (
                        <Chip
                          label={t("skillForm.draft")}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.6rem" }}
                        />
                      )}
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label={t("skillForm.generateFromLabel")}
                    placeholder={t("skillForm.generateFromPlaceholder")}
                  />
                )}
                sx={{ flex: 1 }}
                size="small"
                disabled={submitting}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHighIcon />}
                disabled={!generateUnit || submitting}
                onClick={() => {
                  if (generateUnit) {
                    onGenerateFromUnit(generateUnit.id);
                    setGenerateUnit(null);
                  }
                }}
              >
                {t("skillForm.generate")}
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default SkillForm;
