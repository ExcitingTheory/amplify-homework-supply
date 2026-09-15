"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import { BUILT_IN_TIMING_PATTERNS } from "@/utils/assignmentTiming";
import SettingsContext from "@/context/settingsContext";

export function TimingPatternPicker({ value, onChange, disabled = false }) {
  const t = useTranslations();
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};
  const savedPatterns = Array.isArray(settings?.timingPatterns)
    ? settings.timingPatterns
    : [];
  const options = [...BUILT_IN_TIMING_PATTERNS, ...savedPatterns];
  const [saving, setSaving] = React.useState(false);

  const saveAsNewPattern = async () => {
    if (!value || !updateSettings) return;
    const name = window.prompt(
      t("timingPattern.namePrompt", "Name this timing pattern"),
      value.name,
    );
    if (!name?.trim()) return;

    setSaving(true);
    try {
      const pattern = {
        ...value,
        id: `custom-${Date.now()}`,
        name: name.trim(),
      };
      await updateSettings({ timingPatterns: [...savedPatterns, pattern] });
      onChange(pattern);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Autocomplete
        fullWidth
        options={options}
        value={value || null}
        onChange={(_, nextValue) => onChange(nextValue)}
        getOptionLabel={(option) => option?.name || ""}
        isOptionEqualToValue={(option, selected) => option?.id === selected?.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("timingPattern.label", "Availability window")}
          />
        )}
        disabled={disabled}
      />
      <Button
        variant="outlined"
        onClick={saveAsNewPattern}
        disabled={disabled || saving || !value || !updateSettings}
        sx={{ whiteSpace: "nowrap" }}
      >
        {t("timingPattern.saveAsNew", "Save as new pattern")}
      </Button>
    </Stack>
  );
}
