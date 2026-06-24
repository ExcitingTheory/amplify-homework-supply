/**
 * RecordingStudio3 AudioFilterPanel
 *
 * MUI Chip toggles for audio processing presets. Each chip toggles a filter
 * on/off. Multiple filters can be active simultaneously. A tooltip on hover
 * explains what each filter targets.
 *
 * Emits `onFiltersChange(activeFilters: Set<string>)` on any toggle.
 */
import React, { useState, useCallback } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";

const FILTER_PRESETS = [
  {
    id: "derumble",
    label: "De-rumble",
    description: "Removes low-frequency vibration, desk/keyboard noise, and hum (highpass @ 80 Hz)",
  },
  {
    id: "pop",
    label: "Pop filter",
    description: "Reduces plosive blasts from \"p\" and \"b\" sounds in close-mic recordings",
  },
  {
    id: "noisecancel",
    label: "Noise cancel",
    description: "ML-powered noise suppression — removes background fans, AC, keyboard, and street noise",
  },
  {
    id: "compress",
    label: "Compress",
    description: "Evens out loud and quiet sections for consistent playback volume",
  },
  {
    id: "presence",
    label: "Presence",
    description: "Boosts speech clarity at 3 kHz — improves intelligibility for language learners",
  },
];

export default function AudioFilterPanel({ activeFilters, onFiltersChange }) {
  const handleToggle = useCallback(
    (filterId) => {
      const next = new Set(activeFilters);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      onFiltersChange(next);
    },
    [activeFilters, onFiltersChange]
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
      >
        <GraphicEqIcon fontSize="small" />
        Audio Filters
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {FILTER_PRESETS.map((preset) => {
          const isActive = activeFilters.has(preset.id);
          return (
            <Tooltip key={preset.id} title={preset.description} arrow>
              <Chip
                label={preset.label}
                variant={isActive ? "filled" : "outlined"}
                color={isActive ? "primary" : "default"}
                size="small"
                onClick={() => handleToggle(preset.id)}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
