"use client";
import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

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

type BandKey = (typeof BANDS)[number]["key"];

/**
 * Segmented donut with an attached legend. Hovering a segment or its legend
 * row sets the same `hovered` state, so either direction highlights the
 * legend text and "explodes" the segment — scaled up from the donut's own
 * center, which simultaneously grows it and displaces it outward along its
 * own arc.
 */
export function GradeDistributionDonut({
  distribution,
  size = 96,
}: GradeDistributionDonutProps) {
  const [hovered, setHovered] = React.useState<BandKey | null>(null);
  const { a = 0, b = 0, c = 0, f = 0, total = 0 } = distribution;
  if (total === 0) return null;

  const strokeWidth = size * 0.18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
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
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 2 }}
      role="img"
      aria-label={tooltipText}
    >
      <Box sx={{ flexShrink: 0 }}>
        {/* overflow visible so the hover-exploded segment isn't clipped by the SVG's own viewport */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: "visible" }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              onMouseEnter={() => setHovered(arc.key)}
              onMouseLeave={() => setHovered((h) => (h === arc.key ? null : h))}
              style={{
                cursor: "pointer",
                transformOrigin: `${center}px ${center}px`,
                transform:
                  hovered === arc.key
                    ? `rotate(-90deg) scale(1.08)`
                    : "rotate(-90deg)",
                transition: "transform 0.15s ease",
              }}
            />
          ))}
        </svg>
      </Box>
      <Stack spacing={0.5}>
        {segments.map((band) => {
          const isHovered = hovered === band.key;
          return (
            <Box
              key={band.key}
              onMouseEnter={() => setHovered(band.key)}
              onMouseLeave={() =>
                setHovered((h) => (h === band.key ? null : h))
              }
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                cursor: "pointer",
                bgcolor: isHovered ? alpha(band.color, 0.14) : "transparent",
                transition: "background-color 0.15s ease",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  bgcolor: band.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isHovered ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {band.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: "auto", pl: 1 }}
              >
                {band.count}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
