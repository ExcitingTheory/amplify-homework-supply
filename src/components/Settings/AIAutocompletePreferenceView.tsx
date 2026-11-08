"use client";

import React from "react";
import { Alert, Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export interface AIAutocompletePreferenceViewProps {
  enabled: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (enabled: boolean) => void;
}

export function AIAutocompletePreferenceView({
  enabled,
  disabled = false,
  error,
  onChange,
}: AIAutocompletePreferenceViewProps) {
  const t = useTranslations("editor.ai");
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t("autocompletePreference.description")}
      </Typography>
      <FormControlLabel
        control={<Switch checked={enabled} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />}
        label={t("autocompletePreference.enabled")}
      />
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}
