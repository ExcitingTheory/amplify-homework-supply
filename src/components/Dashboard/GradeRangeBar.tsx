"use client";
import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";

export interface GradeRangeBarProps {
  /** Icon identifying this row (check-circle for raw grades, tune for curved) — mirrors the answer block's icon-led meter rows. */
  icon: React.ReactNode;
  /** Best-per-student accuracy values (0-100) backing this unit's grades — the real distribution, not just a 3-number summary. */
  values: number[];
  /** Row title used in the icon's tooltip, e.g. "Grades", "Raw", "Curved" — not rendered inline, so the bar lines up with the completion progress bar above it. */
  label: string;
}

const PILLS = [
  { key: "min", abbr: "Min", shade: 0.18 },
  { key: "avg", abbr: "Avg", shade: 0.32 },
  { key: "max", abbr: "Max", shade: 0.52 },
] as const;

/** Above this fill opacity the tint reads dark enough to need contrastText instead of solid primary. */
const DARK_FILL_THRESHOLD = 0.4;

function textColorForShade(theme: Theme, shade: number) {
  return shade >= DARK_FILL_THRESHOLD
    ? theme.palette.primary.contrastText
    : theme.palette.primary.main;
}

/** Mirrors the A/B/C/F thresholds used for the Class Health distribution — drawn as gridlines, not solid fills, so they give context without dominating the bar. */
const GRADE_THRESHOLDS = [60, 80, 90] as const;

function clampPct(n: number) {
  return Math.max(0, Math.min(100, n));
}

function computeStats(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return { min, avg, median, max };
}

/**
 * Absolute 0-100 scale distribution bar: a min-max range band plotted at
 * its true position (not scaled to fill the track), one tick per student
 * score so clustering/outliers are visible, and distinct avg/median markers —
 * overlaid on faint letter-grade gridlines so the spread reads against
 * grade cutoffs. Exact min/avg/median/max still called out as text alongside.
 */
export function GradeRangeBar({ icon, values, label }: GradeRangeBarProps) {
  const theme = useTheme();
  const ink = theme.palette.primary.main;
  const stats = computeStats(values);
  const min = clampPct(stats.min);
  const max = clampPct(stats.max);
  const avg = clampPct(stats.avg);
  const median = clampPct(stats.median);
  const rangeLeft = Math.min(min, max);
  const rangeWidth = Math.max(Math.abs(max - min), 1);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip
        title={`${label}: min ${Math.round(min)}% · avg ${Math.round(avg)}% · median ${Math.round(median)}% · max ${Math.round(max)}% · ${values.length} student${values.length === 1 ? "" : "s"}`}
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
        {/* Gridlines, range, and per-student ticks stay clipped to the track; the avg marker below deliberately pokes past it. */}
        <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {GRADE_THRESHOLDS.map((threshold) => (
            <Box
              key={threshold}
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${threshold}%`,
                width: "1px",
                bgcolor: "divider",
                opacity: 0.6,
              }}
            />
          ))}
          <Tooltip title={`Range: ${Math.round(min)}%–${Math.round(max)}%`}>
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
          {values.map((v, i) => (
            <Tooltip key={i} title={`${Math.round(v)}%`}>
              <Box
                sx={{
                  position: "absolute",
                  top: 2,
                  bottom: 2,
                  left: `${clampPct(v)}%`,
                  width: "2px",
                  ml: "-1px",
                  bgcolor: alpha(ink, 0.7),
                }}
              />
            </Tooltip>
          ))}
        </Box>
        <Tooltip title={`Avg: ${Math.round(avg)}%`}>
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
        <Tooltip title={`Median: ${Math.round(median)}%`}>
          <Box
            sx={{
              position: "absolute",
              top: -3,
              bottom: -3,
              left: `${median}%`,
              width: "3px",
              ml: "-1.5px",
              bgcolor: theme.palette.info.main,
              boxShadow: `0 0 0 1px ${theme.palette.background.paper}`,
            }}
          />
        </Tooltip>
      </Box>
      <Typography
        variant="caption"
        noWrap
        sx={{
          flexShrink: 0,
          fontSize: "0.65rem",
          color: "text.secondary",
        }}
      >
        {Math.round(min)}–{Math.round(max)}%{" "}
        <Box
          component="span"
          sx={{ color: theme.palette.warning.main, fontWeight: 700 }}
        >
          avg {Math.round(avg)}
        </Box>{" "}
        <Box
          component="span"
          sx={{ color: theme.palette.info.main, fontWeight: 700 }}
        >
          med {Math.round(median)}
        </Box>
      </Typography>
    </Box>
  );
}

export interface CompletionBarProps {
  /** Submission completion percentage (0-100). */
  pct: number;
}

/** Same shade range as the min/avg/max pills (lightest to darkest), linearly by value. */
function shadeForValue(pct: number) {
  const MIN_SHADE = PILLS[0].shade;
  const MAX_SHADE = PILLS[PILLS.length - 1].shade;
  return (
    MIN_SHADE +
    (Math.max(0, Math.min(100, pct)) / 100) * (MAX_SHADE - MIN_SHADE)
  );
}

/**
 * Completion bar — same squared track, primary-tinted fill, and
 * inside-pill label as GradeRangeBar, so all three unit-progress rows
 * read as one family instead of three different bar styles/colors.
 */
export function CompletionBar({ pct }: CompletionBarProps) {
  const theme = useTheme();
  const ink = theme.palette.primary.main;
  const value = Math.round(Math.max(0, Math.min(100, pct)));
  const remainder = 100 - value;
  const shade = shadeForValue(value);

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minWidth: 0,
        height: 20,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          flex: `${Math.max(value, 1)} 0 0%`,
          minWidth: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          bgcolor: alpha(ink, shade),
          transition: "background-color 0.15s",
          "&:hover": {
            bgcolor: alpha(ink, Math.min(shade + 0.2, 0.9)),
          },
        }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{
            fontWeight: 700,
            fontSize: "0.65rem",
            color: textColorForShade(theme, shade),
          }}
        >
          {value}%
        </Typography>
      </Box>
      {remainder > 0 && <Box sx={{ flex: `${remainder} 0 0%` }} />}
    </Box>
  );
}
