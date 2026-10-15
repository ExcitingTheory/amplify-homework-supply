"use client";
import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export interface SubmissionTimingBarProps {
  icon: React.ReactNode;
  /** Days between each student's first completion and the assignment due date — negative is early, positive is late. */
  offsets: number[];
}

function computeStats(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { min, avg, max };
}

function formatDays(n: number) {
  const rounded = Math.round(Math.abs(n) * 10) / 10;
  if (rounded === 0) return "on the due date";
  return `${rounded}d ${n < 0 ? "early" : "late"}`;
}

/**
 * Symmetric scale centered on the due date (0) — same range-band + per-student
 * ticks + avg-marker pattern as GradeRangeBar, but plotting how early/late
 * each student's first completion landed instead of a grade.
 */
export function SubmissionTimingBar({
  icon,
  offsets,
}: SubmissionTimingBarProps) {
  const theme = useTheme();
  const ink = theme.palette.primary.main;
  const stats = computeStats(offsets);
  const domain = Math.max(
    3,
    Math.ceil(Math.max(Math.abs(stats.min), Math.abs(stats.max))),
  );
  const toPct = (v: number) => ((v + domain) / (domain * 2)) * 100;
  const min = toPct(stats.min);
  const max = toPct(stats.max);
  const avg = toPct(stats.avg);
  const rangeLeft = Math.min(min, max);
  const rangeWidth = Math.max(Math.abs(max - min), 1);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip
        title={`Submission timing: min ${formatDays(stats.min)} · avg ${formatDays(stats.avg)} · max ${formatDays(stats.max)} · ${offsets.length} student${offsets.length === 1 ? "" : "s"}`}
      >
        <Box
          component="span"
          sx={{ display: "inline-flex", color: "text.disabled" }}
        >
          {icon}
        </Box>
      </Tooltip>
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          height: 20,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {/* Due-date gridline at the center */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: "1px",
              bgcolor: "divider",
            }}
          />
          <Tooltip
            title={`Range: ${formatDays(stats.min)} – ${formatDays(stats.max)}`}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${rangeLeft}%`,
                width: `${rangeWidth}%`,
                bgcolor: alpha(ink, 0.3),
              }}
            />
          </Tooltip>
          {offsets.map((v, i) => (
            <Tooltip key={i} title={formatDays(v)}>
              <Box
                sx={{
                  position: "absolute",
                  top: 2,
                  bottom: 2,
                  left: `${toPct(v)}%`,
                  width: "2px",
                  ml: "-1px",
                  bgcolor: alpha(ink, 0.7),
                }}
              />
            </Tooltip>
          ))}
        </Box>
        <Tooltip title={`Avg: ${formatDays(stats.avg)}`}>
          <Box
            sx={{
              position: "absolute",
              top: -3,
              bottom: -3,
              left: `${avg}%`,
              width: "3px",
              ml: "-1.5px",
              bgcolor: theme.palette.warning.main,
              boxShadow: `0 0 0 1px ${theme.palette.background.paper}`,
            }}
          />
        </Tooltip>
      </Box>
      <Typography
        variant="caption"
        noWrap
        sx={{ flexShrink: 0, fontSize: "0.65rem", color: "text.secondary" }}
      >
        avg{" "}
        <Box
          component="span"
          sx={{ color: theme.palette.warning.main, fontWeight: 700 }}
        >
          {formatDays(stats.avg)}
        </Box>
      </Typography>
    </Box>
  );
}
