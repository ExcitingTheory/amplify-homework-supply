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
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

type SectionLocation = {
  school?: { name: string; address: string } | null;
  campus?: string | null;
  buildingName?: string | null;
  roomNumber?: string | null;
};

interface SectionLocationDefaultsProps {
  defaultLocation?: SectionLocation | null;
  isLoading: boolean;
  loadError: string | null;
  onSave: (location: SectionLocation | null) => Promise<void>;
}

export default function SectionLocationDefaults({
  defaultLocation,
  isLoading,
  loadError,
  onSave,
}: SectionLocationDefaultsProps) {
  const t = useTranslations("pages");
  const [values, setValues] = React.useState({
    schoolName: "",
    schoolAddress: "",
    campus: "",
    buildingName: "",
    roomNumber: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setValues({
      schoolName: defaultLocation?.school?.name || "",
      schoolAddress: defaultLocation?.school?.address || "",
      campus: defaultLocation?.campus || "",
      buildingName: defaultLocation?.buildingName || "",
      roomNumber: defaultLocation?.roomNumber || "",
    });
  }, [defaultLocation]);

  const updateValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
    setSaved(false);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schoolName = values.schoolName.trim();
    const schoolAddress = values.schoolAddress.trim();
    if (Boolean(schoolName) !== Boolean(schoolAddress)) {
      setError(t("adminSettings.sectionLocationDefaults.schoolNameAndAddressRequired"));
      setSaved(false);
      return;
    }

    const location: SectionLocation = {
      school:
        schoolName && schoolAddress
          ? { name: schoolName, address: schoolAddress }
          : null,
      campus: values.campus.trim() || null,
      buildingName: values.buildingName.trim() || null,
      roomNumber: values.roomNumber.trim() || null,
    };
    const hasLocation = Object.values(location).some((value) =>
      typeof value === "string" ? Boolean(value) : value != null,
    );

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(hasLocation ? location : null);
      setSaved(true);
    } catch (saveError) {
      console.error("[AdminSettings] Failed to save section location defaults:", saveError);
      setError(t("adminSettings.sectionLocationDefaults.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {t("adminSettings.sectionLocationDefaults.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("adminSettings.sectionLocationDefaults.description")}
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
            {t("adminSettings.sectionLocationDefaults.saved")}
          </Alert>
        )}
        <Box
          component="form"
          onSubmit={handleSave}
          sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "1fr 1fr" } }}
        >
          <TextField
            label={t("adminSettings.sectionLocationDefaults.schoolName")}
            value={values.schoolName}
            onChange={(event) => updateValue("schoolName", event.target.value)}
            disabled={isLoading || Boolean(loadError) || saving}
            fullWidth
          />
          <TextField
            label={t("adminSettings.sectionLocationDefaults.schoolAddress")}
            value={values.schoolAddress}
            onChange={(event) =>
              updateValue("schoolAddress", event.target.value)
            }
            disabled={isLoading || Boolean(loadError) || saving}
            fullWidth
          />
          <TextField
            label={t("adminSettings.sectionLocationDefaults.campus")}
            value={values.campus}
            onChange={(event) => updateValue("campus", event.target.value)}
            disabled={isLoading || Boolean(loadError) || saving}
            fullWidth
          />
          <TextField
            label={t("adminSettings.sectionLocationDefaults.buildingName")}
            value={values.buildingName}
            onChange={(event) =>
              updateValue("buildingName", event.target.value)
            }
            disabled={isLoading || Boolean(loadError) || saving}
            fullWidth
          />
          <TextField
            label={t("adminSettings.sectionLocationDefaults.roomNumber")}
            value={values.roomNumber}
            onChange={(event) => updateValue("roomNumber", event.target.value)}
            disabled={isLoading || Boolean(loadError) || saving}
            fullWidth
          />
          <CardActions sx={{ gridColumn: "1 / -1", px: 0 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || Boolean(loadError) || saving}
              startIcon={
                saving ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {saving
                ? t("adminSettings.sectionLocationDefaults.saving")
                : t("adminSettings.sectionLocationDefaults.save")}
            </Button>
          </CardActions>
        </Box>
      </CardContent>
    </Card>
  );
}
