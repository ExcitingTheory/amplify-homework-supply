"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { readableInk } from "@/themes/heraldry";
import { getGrainySheenSx } from "@/utils/grainySheen";
import { DASHBOARD_TOKENS } from "./constants";

export interface DashboardHeroViewProps {
  greeting: string;
  /** Full assignment card slot for the Today section (page passes <AssignmentCard>). */
  nextStepCard?: React.ReactNode;
  caughtUpText: string;
}

/**
 * Presentational dashboard hero. The page resolves next-step data and
 * passes it in as props/slots so this can render standalone (e.g. the
 * Design System Showcase) and inside the real dashboard alike.
 */
export function DashboardHeroView({
  greeting,
  nextStepCard,
  caughtUpText,
}: DashboardHeroViewProps) {
  const theme = useTheme();
  const heroStart = theme.palette.secondary.main;
  const heroEnd = theme.palette.error.main;
  const ink = readableInk(heroStart);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <Paper
      data-tour="dashboard-hero"
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
        border: "1px solid",
        borderColor: "divider",
        ...getGrainySheenSx(heroStart, heroEnd),
        color: ink,
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "inherit",
            opacity: 0.75,
            mb: 0.5,
          }}
        >
          {todayLabel}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "inherit",
            lineHeight: 1.15,
            mb: nextStepCard ? 2 : 1,
          }}
        >
          {greeting}
        </Typography>

        {nextStepCard || (
          <Typography variant="body2" sx={{ color: "inherit", opacity: 0.8 }}>
            {caughtUpText}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
