"use client";
import React from "react";
import { Box, Tooltip } from "@mui/material";

export interface GradeDistributionDonutProps {
  distribution: {
    a?: number;
    b?: number;
    c?: number;
    f?: number;
    total?: number;
  };
  size?: number;
}

const BANDS = [
  { key: "a", label: "A (90+)", color: "#66bb6a" },
  { key: "b", label: "B (80–89)", color: "#42a5f5" },
  { key: "c", label: "C (60–79)", color: "#ffa726" },
  { key: "f", label: "F (<60)", color: "#ef5350" },
] as const;

/** Segmented donut showing each grade band's share of a section (replaces the stacked bar). */
export function GradeDistributionDonut({
  distribution,
  size = 72,
}: GradeDistributionDonutProps) {
  const { a = 0, b = 0, c = 0, f = 0, total = 0 } = distribution;
  if (total === 0) return null;

  const strokeWidth = size * 0.18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const counts = { a, b, c, f };

  const segments = BANDS.map((band) => ({
    ...band,
    count: counts[band.key],
  })).filter((band) => band.count > 0);

  let cursor = 0;
  const arcs = segments.map((band) => {
    const length = (band.count / total) * circumference;
    const arc = { ...band, length, offset: cursor };
    cursor += length;
    return arc;
  });

  const tooltipText = segments
    .map(
      (band) =>
        `${band.label}: ${band.count} student${band.count !== 1 ? "s" : ""}`,
    )
    .join(" · ");

  return (
    <Tooltip title={tooltipText}>
      <Box sx={{ display: "inline-flex" }} role="img" aria-label={tooltipText}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </svg>
      </Box>
    </Tooltip>
  );
}
