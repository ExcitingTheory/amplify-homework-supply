"use client";
import React from "react";
import { Box, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export interface TrendSparklineProps {
  /** Trailing 7-day counts, oldest first, today last. */
  data: { date: string; count: number }[];
  color?: string;
}

/** Compact, label-free 7-bar sparkline for inline use next to a headline stat. */
export function TrendSparkline({ data, color }: TrendSparklineProps) {
  const theme = useTheme();
  const ink = color || theme.palette.warning.main;
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Box
      sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 14 }}
    >
      {data.map((day, i) => {
        const isToday = i === data.length - 1;
        const height =
          day.count > 0 ? Math.max((day.count / maxCount) * 14, 3) : 1;
        return (
          <Tooltip
            key={day.date}
            title={`${new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${day.count}`}
          >
            <Box
              sx={{
                width: 4,
                height,
                borderRadius: "1px",
                bgcolor: isToday ? ink : alpha(ink, 0.4),
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
