/**
 * LevelBadge — Displays a student's current level as an education-themed
 * icon with an XP progress bar toward the next level.
 *
 * @module LevelBadge
 */

import React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Badge from "@mui/material/Badge";
import { useTheme, type Theme } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import SchoolIcon from "@mui/icons-material/School";
import type { LevelInfo } from "../../utils/xpCalculation";
import { SEMANTIC_THEME } from "../../themes/semanticTheme";
import { metalForTier, medallionBadgeSx } from "../../themes/heraldry";
import { Medallion } from "./Medallion";

export interface LevelBadgeProps {
  /** Level information from XP context. */
  level: LevelInfo;
  /** Whether to show the progress bar. Defaults to true. */
  showProgress?: boolean;
  /** Size variant. Defaults to 'medium'. */
  size?: "small" | "medium";
}

/**
 * Level → color ramp derived from the live theme palette (neutral, then
 * success/info/secondary/warning/error) so it respects dark mode and any
 * user theme customization instead of fixed hex. Shared with AvatarDisplay's
 * level indicator so both stay in sync.
 */
export function getLevelColors(theme: Theme): Record<number, string> {
  const p = theme.palette;
  return {
    // Level 1's grey is intentionally mode-independent here — theme.palette.mode
    // is static under this app's CSS-variables theming, so picking a shade by
    // mode here would never update at runtime. Consumers that render this in
    // an sx callback override it for dark mode via theme.applyStyles instead
    // (see the Chip sx below, and AvatarDisplay's level-ring sx).
    1: p.grey[500],
    2: p.success.main,
    3: p.info.main,
    4: p.secondary.main,
    5: p.warning.main,
    6: p.error.main,
  };
}

const LEVEL_ICONS: Record<number, React.ReactElement> = {
  1: <AutoStoriesIcon fontSize="small" />, // Beginner — open book
  2: <TravelExploreIcon fontSize="small" />, // Explorer — globe search
  3: <HistoryEduIcon fontSize="small" />, // Practitioner — quill
  4: <Diversity3Icon fontSize="small" />, // Contributor — group
  5: <EmojiObjectsIcon fontSize="small" />, // Expert — lightbulb
  6: <SchoolIcon fontSize="small" />, // Master — graduation cap
};

export function LevelBadge({
  level,
  showProgress = true,
  size = "medium",
}: LevelBadgeProps) {
  const theme = useTheme();
  const LEVEL_COLORS = React.useMemo(() => getLevelColors(theme), [theme]);
  const color = LEVEL_COLORS[level.level] || LEVEL_COLORS[1];
  const textColor = theme.palette.getContrastText(color);
  const icon = LEVEL_ICONS[level.level] || LEVEL_ICONS[1];
  const isSmall = size === "small";

  const tooltipText =
    level.xpForNextLevel !== null
      ? `Lvl. ${level.level} · ${level.label} — ${level.progress}% to Lvl. ${level.level + 1}`
      : `Lvl. ${level.level} · ${level.label}`;

  // App-bar variant: a heraldic medallion (shared finish and 30px height with
  // StreakIndicator/StreakShield) with the level number as a small corner badge.
  if (isSmall) {
    const metal = metalForTier(level.level * 3000, theme);
    return (
      <Tooltip title={tooltipText} arrow>
        <Badge
          aria-label={tooltipText}
          badgeContent={level.level}
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={medallionBadgeSx(color, textColor)}
        >
          <Medallion
            shape="hex"
            size={30}
            rimMetal={metal}
            fieldColor={color}
            charge={React.cloneElement(icon, {
              sx: { fontSize: 16, color: textColor },
            })}
            ariaLabel={tooltipText}
          />
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <Box
        aria-live="polite"
        aria-atomic="true"
        aria-label={tooltipText}
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Chip
          icon={icon}
          label={`Lvl. ${level.level}`}
          size={isSmall ? "small" : "medium"}
          sx={(theme) => ({
            bgcolor: color,
            color: textColor,
            fontWeight: 700,
            fontSize: isSmall ? "0.6875rem" : "0.875rem",
            "& .MuiChip-icon": { color: textColor },
            ...(isSmall
              ? {
                  height: 20,
                  "& .MuiChip-label": { px: 0.5 },
                  "& .MuiChip-icon": {
                    color: textColor,
                    fontSize: 14,
                    ml: "4px",
                    mr: "-4px",
                  },
                }
              : {}),
            // Level 1's neutral grey comes from a fixed light-mode shade (see
            // getLevelColors) that doesn't track runtime dark/light toggling
            // under MUI's CSS-variables theming — override it via the
            // CSS-selector-based applyStyles instead of theme.palette.mode.
            ...(level.level === 1 &&
              theme.applyStyles("dark", {
                bgcolor: theme.palette.grey[700],
                color: "#f5f5f5",
                "& .MuiChip-icon": { color: "#f5f5f5" },
              })),
          })}
        />
        {showProgress && level.xpForNextLevel !== null && (
          <Box sx={{ width: "100%", minWidth: isSmall ? 60 : 100 }}>
            <LinearProgress
              variant="determinate"
              value={level.progress}
              sx={{
                height: isSmall ? 4 : 6,
                borderRadius: `${SEMANTIC_THEME.radius.progress}px`,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": { bgcolor: color },
              }}
            />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

export default LevelBadge;
