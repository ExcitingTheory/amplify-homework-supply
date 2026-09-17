"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const CARD_SX = {
  padding: "2rem 1rem",
  margin: "1rem auto",
  height: "fit-content",
  maxWidth: "60rem",
} as const;

export interface LocaleOption {
  code: string;
  name: string;
}

export interface LanguagePreferenceViewProps {
  selectedLocale: string;
  availableLocales: LocaleOption[];
  onChange: (event: SelectChangeEvent) => void;
}

/**
 * LanguagePreferenceView — presentational language/locale selector card. The
 * router push + persistence happen in the settings page's onChange handler.
 */
export function LanguagePreferenceView({
  selectedLocale,
  availableLocales,
  onChange,
}: LanguagePreferenceViewProps) {
  const t = useTranslations("pages");
  return (
    <Card sx={CARD_SX}>
      <h1>{t("profile.languagePreference.heading")}</h1>
      <p>{t("profile.languagePreference.description")}</p>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="locale-select-label">
          {t("profile.languagePreference.selectLanguage")}
        </InputLabel>
        <Select
          labelId="locale-select-label"
          id="locale-select"
          value={selectedLocale}
          label={t("profile.languagePreference.selectLanguage")}
          onChange={onChange}
        >
          {availableLocales.map((option) => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Card>
  );
}

export default LanguagePreferenceView;
