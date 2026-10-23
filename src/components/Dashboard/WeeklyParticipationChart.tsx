"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Box, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export interface WeeklyParticipationChartProps {
  /** Submission counts for the trailing 7 days, oldest first, today last. */
  days: { date: string; count: number }[];
}

const TRACK_HEIGHT = 32;

/** Bar chart of submissions per day over the trailing week — today's bar is the only solid-filled one. */
export function WeeklyParticipationChart({
  days,
}: WeeklyParticipationChartProps) {
  const t = useTranslations("components");
  const theme = useTheme();
  const ink = theme.palette.primary.main;
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "block",
          mb: 1,
        }}
      >
        {t("weeklyParticipationChart.title")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 0.75,
          height: TRACK_HEIGHT,
        }}
      >
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          const height =
            day.count > 0
              ? Math.max((day.count / maxCount) * TRACK_HEIGHT, 4)
              : 2;
          return (
            <Tooltip
              key={day.date}
              title={t("weeklyParticipationChart.dayTooltip", {
                date: new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }),
                count: day.count,
              })}
            >
              <Box
                sx={{
                  flex: 1,
                  height,
                  borderRadius: 0.5,
                  bgcolor: isToday ? ink : alpha(ink, 0.35),
                  transition: "height 0.15s ease",
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 0.75, mt: 0.5 }}>
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          return (
            <Typography
              key={day.date}
              variant="caption"
              sx={{
                flex: 1,
                textAlign: "center",
                fontSize: "0.6rem",
                fontWeight: isToday ? 700 : 400,
                color: isToday ? "text.primary" : "text.secondary",
              }}
            >
              {new Date(day.date).toLocaleDateString(undefined, {
                weekday: "narrow",
              })}
            </Typography>
          );
        })}
      </Box>
      {total === 0 && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: "block", mt: 0.5 }}
        >
          {t("weeklyParticipationChart.noSubmissions")}
        </Typography>
      )}
    </Box>
  );
}
