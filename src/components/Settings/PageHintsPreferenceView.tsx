"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

export interface PageHintsPreferenceViewProps {
  showTips: boolean;
  /** True when at least one tip has already been shown or dismissed. */
  canReset: boolean;
  disabled?: boolean;
  onShowTipsChange: (show: boolean) => void;
  onReset: () => void;
}

/**
 * PageHintsPreferenceView — toggle for first-visit page tips, plus a reset
 * that lets already-seen tips appear again. Embedded in a settings accordion.
 */
export function PageHintsPreferenceView({
  showTips,
  canReset,
  disabled = false,
  onShowTipsChange,
  onReset,
}: PageHintsPreferenceViewProps) {
  const t = useTranslations("components");
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("pageHints.settings.description")}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={showTips}
            disabled={disabled}
            onChange={(event) => onShowTipsChange(event.target.checked)}
          />
        }
        label={t("pageHints.settings.showTips")}
      />
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || (!canReset && showTips)}
          onClick={onReset}
        >
          {t("pageHints.settings.reset")}
        </Button>
      </Box>
    </Box>
  );
}

export default PageHintsPreferenceView;
