"use client";
import React from "react";
import { useTranslations } from "next-intl";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export type DocumentAnalysisPreference = "platform" | "nlp" | "llm";

export interface DocumentAnalysisPreferenceViewProps {
  value: DocumentAnalysisPreference;
  platformDefaultEnabled: boolean;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: DocumentAnalysisPreference) => void;
}

export function DocumentAnalysisPreferenceView({
  value,
  platformDefaultEnabled,
  disabled = false,
  error,
  onChange,
}: DocumentAnalysisPreferenceViewProps) {
  const t = useTranslations("components");
  const defaultMode = platformDefaultEnabled
    ? t("documentAnalysisPreference.llmOnly")
    : t("documentAnalysisPreference.nlpOnly");

  return (
    <>
      <FormControl fullWidth disabled={disabled} error={Boolean(error)}>
        <InputLabel id="document-analysis-preference-label">
          {t("documentAnalysisPreference.label")}
        </InputLabel>
        <Select
          labelId="document-analysis-preference-label"
          label={t("documentAnalysisPreference.label")}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "platform" || next === "nlp" || next === "llm") {
              onChange(next);
            }
          }}
        >
          <MenuItem value="platform">
            {t("documentAnalysisPreference.usePlatformDefault")}
          </MenuItem>
          <MenuItem value="nlp">
            {t("documentAnalysisPreference.nlpOnly")}
          </MenuItem>
          <MenuItem value="llm">
            {t("documentAnalysisPreference.llmOnly")}
          </MenuItem>
        </Select>
        <FormHelperText>
          {error ||
            t("documentAnalysisPreference.description", { defaultMode })}
        </FormHelperText>
      </FormControl>
    </>
  );
}

export default DocumentAnalysisPreferenceView;
