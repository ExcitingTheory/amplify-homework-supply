"use client";

/**
 * Waveform design-system specimen — a faithful, non-interactive visual of the
 * app's "pink and blue" audio waveform (AudioWaveformPlayer).
 *
 * Production colors each bar `rgb(100 + amplitude·155, g, b)` where g/b come
 * from `primary.main` (#556cd6 → g=108, b=214): loud bars turn pink
 * (rgb(255,108,214)), quiet bars stay blue/indigo (rgb(100,108,214)). Bars are
 * drawn symmetric from the vertical center; default height is 80px.
 *
 * @module components/DesignSystem/WaveformSpecimen
 */

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function WaveformSpecimen({
  height = 80,
  samples = 96,
}: {
  height?: number;
  samples?: number;
}) {
  const theme = useTheme();
  const { g, b } = React.useMemo(
    () => hexToRgb(theme.palette.primary.main || "#556cd6"),
    [theme.palette.primary.main],
  );

  // Deterministic pseudo-waveform: fade-in/out envelope × detail texture.
  const amps = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < samples; i++) {
      const env = Math.sin((i / (samples - 1)) * Math.PI);
      const detail =
        0.35 + 0.65 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.29));
      arr.push(Math.min(1, env * detail));
    }
    return arr;
  }, [samples]);

  return (
    <Box
      sx={{
        height,
        display: "flex",
        alignItems: "center",
        gap: "1px",
        px: 1,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {amps.map((amp, i) => {
        const intensity = Math.floor(amp * 155) + 100; // red channel: 100…255
        const barHeight = Math.max(2, amp * (height - 12));
        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: barHeight,
              borderRadius: "1px",
              bgcolor: `rgb(${intensity},${g},${b})`,
            }}
          />
        );
      })}
    </Box>
  );
}
