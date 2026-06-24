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

const CLEANUP_LEVELS = [
  { value: 0, label: "Off", key: "off" },
  { value: 1, label: "Light", key: "light" },
  { value: 2, label: "Standard", key: "standard" },
  { value: 3, label: "Aggressive", key: "aggressive" },
];

const LEVEL_DESCRIPTIONS = {
  off: "No audio cleanup. Raw recording is uploaded as-is.",
  light: "Removes low-frequency rumble (desk vibration, handling noise).",
  standard: "Removes rumble, evens volume, normalizes loudness.",
  aggressive:
    "ML noise suppression (removes fan, AC, keyboard noise) + compression + normalization.",
};

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
          Recording Cleanup
        </Typography>
        <Tooltip title={LEVEL_DESCRIPTIONS[currentLevel.key]} arrow>
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
          label: l.label,
        }))}
        size="small"
        sx={{ maxWidth: 240 }}
        aria-label="Recording cleanup strength"
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {LEVEL_DESCRIPTIONS[currentLevel.key]}
      </Typography>
    </Box>
  );
}
