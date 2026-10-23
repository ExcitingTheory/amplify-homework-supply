/**
 * AvatarDisplay — Composite avatar component showing the DiceBear avatar
 * with streak count, level indicator, a settable badge (emoji + label),
 * and configurable border effects.
 *
 * @module AvatarDisplay
 */

import React from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import SchoolIcon from "@mui/icons-material/School";
import { DiceBearAvatar } from "./DiceBearAvatar";
import { AvatarGlowRing, isGlowActive } from "./AvatarGlowRing";
import { StreakIndicator } from "./StreakIndicator";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { sanitizeSvg } from "../../utils/sanitizeHtml";
import { getLevelColors } from "./LevelBadge";
import type { AvatarStyleTier, AvatarOverrides } from "./DiceBearAvatar";
import type { GlowRingConfig } from "./AvatarGlowRing";
import type { LevelInfo } from "../../utils/xpCalculation";
import { ProfileAvatarLink } from "../ProfileAvatarLink";

// ============================================================================
// Level icon config (colors come from LevelBadge's shared getLevelColors)
// ============================================================================

const LEVEL_ICONS: Record<number, React.ReactElement> = {
  1: <AutoStoriesIcon sx={{ fontSize: "0.9rem" }} />,
  2: <TravelExploreIcon sx={{ fontSize: "0.9rem" }} />,
  3: <HistoryEduIcon sx={{ fontSize: "0.9rem" }} />,
  4: <Diversity3Icon sx={{ fontSize: "0.9rem" }} />,
  5: <EmojiObjectsIcon sx={{ fontSize: "0.9rem" }} />,
  6: <SchoolIcon sx={{ fontSize: "0.9rem" }} />,
};

// ============================================================================
// Types
// ============================================================================

/** Border effect style applied around the avatar */
export type AvatarBorderEffect =
  | "none"
  | "solid"
  | "gradient"
  | "pulse"
  | "rainbow"
  | "fire"
  | "ice"
  | "gold"
  | "shadow";

/** A user-settable badge displayed at the bottom of the avatar */
export interface AvatarBadge {
  /** Emoji character to display */
  emoji: string;
  /** Short label string displayed next to the emoji */
  label: string;
}

export interface AvatarDisplayProps {
  /** Explicit identity for profile navigation; omit for previews and action controls. */
  profileUsername?: string | null;
  /** Seed for DiceBear avatar generation */
  seed: string;
  /** DiceBear style tier */
  style?: AvatarStyleTier;
  /** Avatar size in pixels. Defaults to 64. */
  size?: number;
  /** Current streak count (days). 0 hides the streak indicator. */
  streak?: number;
  /** Level information from XP system */
  level?: LevelInfo;
  /** Settable badge with emoji + label shown across the bottom */
  badge?: AvatarBadge | null;
  /** Border effect around the avatar. Defaults to 'none'. */
  borderEffect?: AvatarBorderEffect;
  /** Custom border color (used with 'solid' and 'gradient' effects) */
  borderColor?: string;
  /** Secondary border color (used with 'gradient' effect) */
  borderColorSecondary?: string;
  /** Optional glow ring config (overrides border effect when active) */
  glowRing?: GlowRingConfig | null;
  /** When true, draws a themed (primary color) outline ring around the avatar face. */
  outline?: boolean;
  /** When true, overlays a subtle glossy highlight across the avatar face. */
  sheen?: boolean;
  /** Avatar customization overrides */
  overrides?: AvatarOverrides;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional tooltip/label */
  label?: string;
  /** Whether the avatar is locked */
  locked?: boolean;
  /** Optional guild/squad crest SVG markup */
  guildCrestSvg?: string | null;
  /** Guild/squad name used for fallback initials + tooltip */
  guildName?: string;
  /** Guild/squad id used for deterministic fallback color */
  guildId?: string;
}

function hashToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

// ============================================================================
// Border effect styles
// ============================================================================

const BORDER_CONFIGS: Record<
  AvatarBorderEffect,
  (color?: string, secondary?: string) => Record<string, unknown>
> = {
  none: () => ({}),
  solid: (color = "#1976d2") => ({
    border: `3px solid ${color}`,
  }),
  gradient: () => ({}), // Handled via AvatarGlowRing
  pulse: () => ({
    border: "3px solid #9c27b0",
    animation: "avatarDisplayPulse 2s ease-in-out infinite",
    "@keyframes avatarDisplayPulse": {
      "0%, 100%": { boxShadow: "0 0 0 0 rgba(156, 39, 176, 0.4)" },
      "50%": { boxShadow: "0 0 0 8px rgba(156, 39, 176, 0)" },
    },
  }),
  rainbow: () => ({}), // Handled via AvatarGlowRing
  fire: () => ({
    border: "3px solid #ff4500",
    boxShadow: "0 0 8px rgba(255, 69, 0, 0.5), 0 0 16px rgba(255, 69, 0, 0.3)",
    animation: "avatarDisplayFire 1.5s ease-in-out infinite alternate",
    "@keyframes avatarDisplayFire": {
      "0%": {
        boxShadow:
          "0 0 8px rgba(255, 69, 0, 0.5), 0 0 16px rgba(255, 69, 0, 0.3)",
      },
      "100%": {
        boxShadow:
          "0 0 12px rgba(255, 165, 0, 0.7), 0 0 24px rgba(255, 69, 0, 0.5)",
      },
    },
  }),
  ice: () => ({
    border: "3px solid #00bfff",
    boxShadow:
      "0 0 8px rgba(0, 191, 255, 0.4), 0 0 16px rgba(135, 206, 235, 0.2)",
  }),
  gold: () => ({
    border: "3px solid #ffd700",
    boxShadow:
      "0 0 6px rgba(255, 215, 0, 0.5), inset 0 0 4px rgba(255, 215, 0, 0.2)",
  }),
  shadow: () => ({
    border: "3px solid #424242",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)",
  }),
};

/** Map border effects that need a glow ring to their ring config */
function getEffectGlowConfig(
  effect: AvatarBorderEffect,
  color?: string,
  secondary?: string,
): GlowRingConfig | null {
  if (effect === "rainbow") {
    return {
      colors: [
        "#ff6b6b",
        "#feca57",
        "#48dbfb",
        "#ff9ff3",
        "#54a0ff",
        "#5f27cd",
      ],
      speed: 3,
      thickness: 3,
      active: true,
      expiresAt: null,
    };
  }
  if (effect === "gradient") {
    return {
      colors: [color || "#ff6b6b", secondary || "#54a0ff"],
      speed: 6,
      thickness: 3,
      active: true,
      expiresAt: null,
    };
  }
  return null;
}

// ============================================================================
// Component
// ============================================================================

export function AvatarDisplay({
  profileUsername,
  seed,
  style = "simple",
  size = 64,
  streak = 0,
  level,
  badge,
  borderEffect = "none",
  borderColor,
  borderColorSecondary,
  glowRing,
  outline = false,
  sheen = false,
  overrides,
  onClick,
  label,
  locked = false,
  guildCrestSvg,
  guildName,
  guildId,
}: AvatarDisplayProps) {
  const t = useTranslations("components");
  const reducedMotion = useReducedMotion();
  const theme = useTheme();
  const ringColor = outline ? theme.palette.primary.main : undefined;
  const levelColors = React.useMemo(() => getLevelColors(theme), [theme]);
  const showGlow = glowRing && isGlowActive(glowRing);
  const effectGlow = reducedMotion
    ? null
    : getEffectGlowConfig(borderEffect, borderColor, borderColorSecondary);
  const activeGlow = showGlow && !reducedMotion ? glowRing! : effectGlow;
  const rawBorderStyles = activeGlow
    ? {}
    : BORDER_CONFIGS[borderEffect](borderColor, borderColorSecondary);
  // Strip animation props when reduced motion is active
  const borderStyles = reducedMotion
    ? Object.fromEntries(
        Object.entries(rawBorderStyles).filter(
          ([k]) => !k.startsWith("animation") && !k.startsWith("@keyframes"),
        ),
      )
    : rawBorderStyles;
  const hasGuildBadge = Boolean(guildCrestSvg || guildName);
  const guildBadgeSize = Math.max(18, Math.round(size * 0.3));
  const guildBgColor = hashToColor(guildId || guildName || seed);
  const guildInitials = getInitials(
    guildName || t("avatarDisplay.guildFallbackName"),
  );

  // Total width including border effect space
  const containerSize = size + 16;

  const content = (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        position: "relative",
        minWidth: containerSize,
      }}
    >
      {/* Streak indicator — 4 o'clock position (shared Medallion, matching
          the app-bar StreakIndicator so streak reads consistently everywhere) */}
      {streak > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: "60%",
            right: -20,
            zIndex: 3,
          }}
        >
          <StreakIndicator currentStreak={streak} size="small" />
        </Box>
      )}

      {/* Guild crest — 8 o'clock position */}
      {hasGuildBadge && (
        <Tooltip
          title={
            guildName
              ? t("avatarDisplay.guildTooltip", { guildName })
              : t("avatarDisplay.guildCrest")
          }
          arrow
        >
          <Box
            sx={{
              position: "absolute",
              top: "60%",
              left: -20,
              zIndex: 3,
              bgcolor: "background.paper",
              borderRadius: "50%",
              boxShadow: 1,
              p: "2px",
              display: "inline-flex",
            }}
          >
            {guildCrestSvg ? (
              <Avatar
                sx={{
                  width: guildBadgeSize,
                  height: guildBadgeSize,
                  bgcolor: "transparent",
                  "& svg": { width: "100%", height: "100%" },
                }}
              >
                <Box
                  component="span"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeSvg(guildCrestSvg),
                  }}
                  sx={{ display: "flex", width: "100%", height: "100%" }}
                />
              </Avatar>
            ) : (
              <Avatar
                sx={{
                  width: guildBadgeSize,
                  height: guildBadgeSize,
                  bgcolor: guildBgColor,
                  fontSize: Math.max(10, Math.round(guildBadgeSize * 0.4)),
                  fontWeight: 700,
                }}
              >
                {guildInitials}
              </Avatar>
            )}
          </Box>
        </Tooltip>
      )}

      {/* Level indicator — 2 o'clock position */}
      {level && (
        <Tooltip
          title={t("avatarDisplay.levelTooltip", {
            level: level.level,
            label: level.label,
          })}
          arrow
        >
          <Box
            sx={{
              position: "absolute",
              top: "28%",
              right: -18,
              zIndex: 3,
              bgcolor: "background.paper",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
              color: levelColors[level.level] || levelColors[1],
            }}
          >
            {LEVEL_ICONS[level.level] || LEVEL_ICONS[1]}
          </Box>
        </Tooltip>
      )}

      {/* Avatar with border effect */}
      <Box
        sx={{
          position: "relative",
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...(!activeGlow ? borderStyles : {}),
          ...(ringColor && {
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${ringColor}`,
          }),
        }}
      >
        {activeGlow ? (
          <AvatarGlowRing size={size} config={activeGlow}>
            <DiceBearAvatar
              seed={seed}
              style={style}
              size={size}
              label={label}
              onClick={onClick}
              locked={locked}
              overrides={overrides}
            />
          </AvatarGlowRing>
        ) : (
          <DiceBearAvatar
            seed={seed}
            style={style}
            size={size}
            label={label}
            onClick={onClick}
            locked={locked}
            overrides={overrides}
          />
        )}
        {sheen && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 2,
              background:
                "radial-gradient(ellipse at 35% 22%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 70%)",
            }}
          />
        )}
      </Box>

      {/* Badge strip — bottom */}
      {badge && (
        <Chip
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span role="img" aria-label={t("avatarDisplay.badgeLabel")}>
                {badge.emoji}
              </span>
              <span>{badge.label}</span>
            </Box>
          }
          size="small"
          sx={{
            mt: -1,
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 600,
            "& .MuiChip-label": { px: 0.75 },
            bgcolor: "action.selected",
            position: "relative",
            zIndex: 2,
          }}
        />
      )}
    </Box>
  );

  return profileUsername ? (
    <ProfileAvatarLink username={profileUsername} displayName={label}>
      {content}
    </ProfileAvatarLink>
  ) : content;
}

export default AvatarDisplay;
