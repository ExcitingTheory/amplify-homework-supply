/**
 * RecordingSettings — Cleanup strength slider for audio recordings.
 *
 * Allows users to control how aggressively pre-submission audio cleanup
 * is applied to human recordings. TTS-generated takes are never processed.
 *
 * Strength levels:
 * - Off: No cleanup applied (raw recording uploaded)
 * - Light: Highpass @ 80 Hz only (removes sub-bass rumble)
 * - Standard: Highpass + compress + normalize (default)
 * - Aggressive: Highpass + RNNoise ML noise suppression + compress + normalize
 */

import React from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslations } from "next-intl";

const CLEANUP_LEVELS = [
  {
    value: 0,
    key: "off",
    getLabel: (t) => t("recordingSettings.levelOff"),
    getDescription: (t) => t("recordingSettings.levelOffDescription"),
  },
  {
    value: 1,
    key: "light",
    getLabel: (t) => t("recordingSettings.levelLight"),
    getDescription: (t) => t("recordingSettings.levelLightDescription"),
  },
  {
    value: 2,
    key: "standard",
    getLabel: (t) => t("recordingSettings.levelStandard"),
    getDescription: (t) => t("recordingSettings.levelStandardDescription"),
  },
  {
    value: 3,
    key: "aggressive",
    getLabel: (t) => t("recordingSettings.levelAggressive"),
    getDescription: (t) => t("recordingSettings.levelAggressiveDescription"),
  },
];

/**
 * Map a cleanup strength key to the Set of filter names to apply.
 */
export function getCleanupFilters(strength) {
  switch (strength) {
    case "off":
      return new Set();
    case "light":
      return new Set(["derumble"]);
    case "standard":
      return new Set(["derumble", "compress", "normalize"]);
    case "aggressive":
      return new Set(["derumble", "noisecancel", "compress", "normalize"]);
    default:
      return new Set(["derumble", "compress", "normalize"]);
  }
}

export default function RecordingSettings({ value, onChange }) {
  const t = useTranslations("components");
  const currentLevel =
    CLEANUP_LEVELS.find((l) => l.key === value) || CLEANUP_LEVELS[2]; // default to standard

  const handleSliderChange = (_, newValue) => {
    const level = CLEANUP_LEVELS[newValue];
    if (level && onChange) {
      onChange(level.key);
    }
  };

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t("recordingSettings.title")}
        </Typography>
        <Tooltip title={currentLevel.getDescription(t)} arrow>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
        </Tooltip>
      </Box>
      <Slider
        value={currentLevel.value}
        onChange={handleSliderChange}
        min={0}
        max={3}
        step={1}
        marks={CLEANUP_LEVELS.map((l) => ({
          value: l.value,
          label: l.getLabel(t),
        }))}
        size="small"
        sx={{ maxWidth: 240 }}
        aria-label={t("recordingSettings.strengthAriaLabel")}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {currentLevel.getDescription(t)}
      </Typography>
    </Box>
  );
}
