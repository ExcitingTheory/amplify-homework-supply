"use client";
/**
 * StreakIndicator — Shows the current streak day count as a heraldic flame
 * medallion (shared Medallion finish, matching StreakShield/LevelBadge) with
 * the day count as a small corner badge. Displays nothing when streak is 0.
 * Adds a glow effect at 7-day milestones.
 *
 * @module StreakIndicator
 */

import React from "react";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { useTheme } from "@mui/material/styles";
import { Medallion } from "./Medallion";
import {
  getTinctures,
  metalForTier,
  medallionBadgeSx,
} from "@/themes/heraldry";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface StreakIndicatorProps {
  /** Current streak count in days. */
  currentStreak: number;
  /** Size variant. Defaults to 'medium'. */
  size?: "small" | "medium";
  /** When true, renders a zero-state indicator instead of returning null when streak is 0. */
  showEmpty?: boolean;
  /** Renders a flat outlined Chip pill instead of the heraldic Medallion — for compact app-bar rows. */
  pill?: boolean;
}

export function StreakIndicator({
  currentStreak,
  size = "medium",
  showEmpty = false,
  pill = false,
}: StreakIndicatorProps) {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();

  if (currentStreak <= 0 && !showEmpty) return null;

  const isMilestone = currentStreak >= 7;
  const isSmall = size === "small";
  const px = isSmall ? 30 : 42;
  const ariaLabel = `${currentStreak} day streak`;

  if (pill) {
    return (
      <Chip
        size={isSmall ? "small" : "medium"}
        variant="outlined"
        color={isMilestone ? "warning" : "default"}
        icon={<WhatshotIcon fontSize="small" />}
        label={currentStreak}
        aria-label={ariaLabel}
      />
    );
  }

  const field = getTinctures(theme).gules;
  const metal = metalForTier(currentStreak * 1000, theme);
  const textColor = theme.palette.getContrastText(field.main);

  const charge = (
    <WhatshotIcon
      sx={{
        fontSize: px * 0.5,
        color: isMilestone ? "#ffe082" : "#fff3e0",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
      }}
    />
  );

  return (
    <Badge
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
      badgeContent={currentStreak}
      showZero
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{
        ...medallionBadgeSx(field.main, textColor),
        display: "inline-flex",
        ...(isMilestone &&
          !reducedMotion && {
            animation: "streakPulse 2s ease-in-out infinite",
            "@keyframes streakPulse": {
              "0%, 100%": {
                filter: "drop-shadow(0 0 4px rgba(255,109,0,0.5))",
              },
              "50%": { filter: "drop-shadow(0 0 10px rgba(255,109,0,0.85))" },
            },
          }),
      }}
    >
      <Medallion
        shape="disc"
        size={px}
        rimMetal={metal}
        fieldColor={field.main}
        charge={charge}
        ariaLabel={ariaLabel}
        reducedMotion={reducedMotion}
      />
    </Badge>
  );
}

export default StreakIndicator;
