"use client";
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export interface GradeDonutProps {
  /** 0-100 */
  value: number;
  size?: number;
  /** Accessible label prefix, e.g. "Average grade" or "Completion" */
  label?: string;
}

/** Compact donut ring for a percentage metric (grade or completion), placed next to a title. */
export function GradeDonut({
  value,
  size = 40,
  label = "Average grade",
}: GradeDonutProps) {
  const color = value >= 80 ? "success" : value >= 60 ? "warning" : "error";
  return (
    <Box
      sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
      role="img"
      aria-label={`${label} ${Math.round(value)}%`}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={{ color: "action.disabledBackground" }}
      />
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={4}
        color={color}
        sx={{ position: "absolute", left: 0 }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.7rem" }}>
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  );
}
