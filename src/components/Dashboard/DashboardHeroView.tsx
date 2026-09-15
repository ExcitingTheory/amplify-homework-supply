"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SchoolIcon from "@mui/icons-material/School";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { StreakIndicator } from "../Gamification/StreakIndicator";
import { StreakShield } from "../Gamification/StreakShield";
import { ArmoriaShield } from "../Gamification/ArmoriaShield";

// Stat chip used in the hero bar.
function StatPill({
  icon,
  label,
  value,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 56,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: `${color}.main`,
        }}
      >
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

export interface DashboardHeroLevel {
  level: number;
  label: string;
  progress?: number;
  progressPercent?: number;
}

export interface DashboardHeroNextStep {
  todayLabel: string;
  unitName: string;
  sectionName: string;
  dueText?: string;
}

export interface DashboardHeroSquad {
  id: string;
  name: string;
  crestSvg?: string | null;
  totalXP?: number;
}

export interface DashboardHeroViewProps {
  greeting: string;
  level?: DashboardHeroLevel | null;
  /** Avatar slot (page passes AvatarDisplay; showcase a sample). */
  avatar: React.ReactNode;
  nextStep?: DashboardHeroNextStep | null;
  /** Primary CTA slot (page passes PrefetchButton). */
  startButton?: React.ReactNode;
  caughtUpText: string;
  streak?: {
    currentStreak?: number;
    freezesRemaining?: number;
    freezesUsed?: number;
  };
  showStreakEmpty?: boolean;
  assignmentsCount: number;
  badgesCount: number;
  totalXP: number;
  /** Badge shelf slot (page passes BadgeShelf earnedOnly). */
  badgeShelf?: React.ReactNode;
  squad?: DashboardHeroSquad | null;
}

/**
 * Presentational dashboard hero. All gamification data is resolved by the
 * page and passed in as props/slots so this can render standalone (e.g. the
 * Design System Showcase) and inside the real dashboard alike.
 */
export function DashboardHeroView({
  greeting,
  level,
  avatar,
  nextStep,
  startButton,
  caughtUpText,
  streak,
  showStreakEmpty = true,
  assignmentsCount,
  badgesCount,
  totalXP,
  badgeShelf,
  squad,
}: DashboardHeroViewProps) {
  const progress = level?.progress ?? level?.progressPercent ?? 0;
  return (
    <Paper
      data-tour="dashboard-hero"
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(25,118,210,0.12)"
            : "rgba(63,81,181,0.08)",
        color: (theme) =>
          theme.palette.mode === "dark" ? "#e3f2fd" : "#1a237e",
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ flexShrink: 0, position: "relative" }}>{avatar}</Box>

        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
              mb: nextStep ? 1.5 : 0.75,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "inherit", lineHeight: 1 }}
            >
              {greeting}
            </Typography>
            {level && (
              <Chip
                label={`Lv. ${level.level} · ${level.label}`}
                size="small"
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(25,118,210,0.3)"
                      : "rgba(63,81,181,0.2)",
                  color: "inherit",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Box>

          {nextStep ? (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "background.paper",
                color: "text.primary",
                display: "flex",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 1.5,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="overline"
                  color="primary.main"
                  sx={{ fontWeight: 800, lineHeight: 1.2 }}
                >
                  {nextStep.todayLabel}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, lineHeight: 1.3 }}
                >
                  {nextStep.unitName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {nextStep.sectionName}
                  {nextStep.dueText ? ` · ${nextStep.dueText}` : ""}
                </Typography>
              </Box>
              {startButton}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "inherit", opacity: 0.8 }}>
              {caughtUpText}
            </Typography>
          )}

          {level && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}
            >
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(63,81,181,0.15)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(63,81,181,0.8)",
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: "inherit", opacity: 0.9, whiteSpace: "nowrap" }}
              >
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            gridColumn: { xs: "1", sm: "2" },
            display: "flex",
            alignItems: "center",
            gap: { xs: 2, sm: 3 },
            flexWrap: "wrap",
            pt: { xs: 0, sm: 0.5 },
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <StreakIndicator
            currentStreak={streak?.currentStreak || 0}
            size="medium"
            showEmpty={showStreakEmpty}
          />
          <StreakShield
            freezesRemaining={streak?.freezesRemaining || 0}
            freezesUsed={streak?.freezesUsed || 0}
            size="medium"
            showEmpty={showStreakEmpty}
          />
          <StatPill
            icon={<EmojiEventsIcon sx={{ fontSize: "1rem" }} />}
            label="Assignments"
            value={assignmentsCount}
            color="warning"
          />
          {badgesCount > 0 && (
            <StatPill
              icon={<SchoolIcon sx={{ fontSize: "1rem" }} />}
              label="Badges"
              value={badgesCount}
              color="success"
            />
          )}
          <Typography
            variant="caption"
            sx={{ color: "inherit", opacity: 0.75 }}
          >
            {totalXP?.toLocaleString() || 0} XP total
          </Typography>
        </Box>
      </Box>

      {badgeShelf && (
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {badgeShelf}
        </Box>
      )}

      {squad && (
        <Box
          component="a"
          href={`/squad/${squad.id}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(25,118,210,0.2)"
                : "rgba(63,81,181,0.12)",
            borderTop: "1px solid",
            borderColor: "divider",
            textDecoration: "none",
            "&:hover": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(25,118,210,0.28)"
                  : "rgba(63,81,181,0.18)",
            },
          }}
        >
          <ArmoriaShield
            squadId={squad.id}
            squadName={squad.name}
            crestSvg={squad.crestSvg}
            size={32}
            showName={false}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "inherit", opacity: 0.7, display: "block" }}
            >
              Your Squad
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "inherit", fontWeight: 600 }}
            >
              {squad.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${(squad.totalXP || 0).toLocaleString()} XP`}
              size="small"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(25,118,210,0.3)"
                    : "rgba(63,81,181,0.2)",
                color: "inherit",
                fontSize: "0.7rem",
              }}
            />
            <ArrowForwardIcon
              sx={{ fontSize: "1rem", color: "inherit", opacity: 0.6 }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
