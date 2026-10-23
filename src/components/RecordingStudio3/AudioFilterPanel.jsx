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
import { useTranslations } from "next-intl";

const FILTER_PRESETS = [
  {
    id: "derumble",
    getLabel: (t) => t("audioFilterPanel.derumbleLabel"),
    getDescription: (t) => t("audioFilterPanel.derumbleDescription"),
  },
  {
    id: "pop",
    getLabel: (t) => t("audioFilterPanel.popLabel"),
    getDescription: (t) => t("audioFilterPanel.popDescription"),
  },
  {
    id: "noisecancel",
    getLabel: (t) => t("audioFilterPanel.noiseCancelLabel"),
    getDescription: (t) => t("audioFilterPanel.noiseCancelDescription"),
  },
  {
    id: "compress",
    getLabel: (t) => t("audioFilterPanel.compressLabel"),
    getDescription: (t) => t("audioFilterPanel.compressDescription"),
  },
  {
    id: "presence",
    getLabel: (t) => t("audioFilterPanel.presenceLabel"),
    getDescription: (t) => t("audioFilterPanel.presenceDescription"),
  },
];

export default function AudioFilterPanel({ activeFilters, onFiltersChange }) {
  const t = useTranslations("components");
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
        {t("audioFilterPanel.title")}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {FILTER_PRESETS.map((preset) => {
          const isActive = activeFilters.has(preset.id);
          return (
            <Tooltip key={preset.id} title={preset.getDescription(t)} arrow>
              <Chip
                label={preset.getLabel(t)}
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
