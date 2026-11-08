"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

interface SectionDatePolicyDefaultProps {
  defaultValue?: boolean | null;
  isLoading: boolean;
  loadError: string | null;
  onSave: (value: boolean) => Promise<void>;
}

export default function SectionDatePolicyDefault({
  defaultValue,
  isLoading,
  loadError,
  onSave,
}: SectionDatePolicyDefaultProps) {
  const t = useTranslations("pages");
  const [value, setValue] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setValue(defaultValue ?? true);
  }, [defaultValue]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(value);
      setSaved(true);
    } catch (saveError) {
      console.error(
        "[AdminSettings] Failed to save outside-section-date default:",
        saveError,
      );
      setError(t("adminSettings.sectionDatePolicyDefault.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {t("adminSettings.sectionDatePolicyDefault.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("adminSettings.sectionDatePolicyDefault.description")}
        </Typography>
        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("adminSettings.sectionDatePolicyDefault.saved")}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSave}>
          <FormControlLabel
            control={
              <Switch
                checked={value}
                onChange={(event) => {
                  setValue(event.target.checked);
                  setSaved(false);
                }}
                disabled={isLoading || Boolean(loadError) || saving}
              />
            }
            label={t("adminSettings.sectionDatePolicyDefault.acceptByDefault")}
          />
          <CardActions sx={{ px: 0 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || Boolean(loadError) || saving}
              startIcon={
                saving ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {saving
                ? t("adminSettings.sectionDatePolicyDefault.saving")
                : t("adminSettings.sectionDatePolicyDefault.save")}
            </Button>
          </CardActions>
        </Box>
      </CardContent>
    </Card>
  );
}
