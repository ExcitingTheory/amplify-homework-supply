"use client";
import React from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { CompletionBar } from "./GradeRangeBar";

export interface SectionComparisonChartProps {
  sections: {
    id: string;
    name: string;
    avgGrade: number;
    completionRate: number;
  }[];
}

/** One row per section, each with an avg-grade bar and a completion-rate bar, so one struggling cohort stands out against the rest. */
export function SectionComparisonChart({
  sections,
}: SectionComparisonChartProps) {
  if (sections.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {sections.map((section) => (
        <Box key={section.id}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
            {section.name}
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Average grade">
                <EmojiEventsIcon
                  sx={{ fontSize: 16, color: "text.disabled" }}
                />
              </Tooltip>
              <CompletionBar pct={section.avgGrade} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Completion rate">
                <AssignmentTurnedInIcon
                  sx={{ fontSize: 16, color: "text.disabled" }}
                />
              </Tooltip>
              <CompletionBar pct={section.completionRate} />
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
