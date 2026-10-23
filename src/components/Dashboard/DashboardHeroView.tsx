"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import SchoolIcon from "@mui/icons-material/School";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ArmoriaShield } from "../Gamification/ArmoriaShield";
import { useTheme } from "@mui/material/styles";
import { getGrainySheenSx } from "@/utils/grainySheen";
import { DASHBOARD_TOKENS } from "./constants";

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

export interface DashboardHeroSquad {
  id: string;
  name: string;
  crestSvg?: string | null;
  totalXP?: number;
}

export interface DashboardHeroViewProps {
  greeting: string;
  /** Full assignment card slot for the Today section (page passes <AssignmentCard>). */
  nextStepCard?: React.ReactNode;
  caughtUpText: string;
  badgesCount?: number;
  /** Badge shelf slot (page passes BadgeShelf earnedOnly). */
  badgeShelf?: React.ReactNode;
  squad?: DashboardHeroSquad | null;
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
  badgesCount = 0,
  badgeShelf,
  squad,
}: DashboardHeroViewProps) {
  const t = useTranslations("components");
  const theme = useTheme();
  const heroStart = theme.palette.secondary.main;
  const heroEnd = theme.palette.error.main;
  // General contrast pick, not a heraldry tincture — use MUI's own API, not readableInk.
  const ink = theme.palette.getContrastText(heroStart);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const hasSecondaryContent = !!badgeShelf || !!squad;
  return (
    <Box>
      <Paper
        data-tour="dashboard-hero"
        elevation={0}
        sx={{
          mb: hasSecondaryContent ? DASHBOARD_TOKENS.spacing.itemGap : 3,
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

          {badgesCount > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mt: 2,
                pt: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <StatPill
                icon={<SchoolIcon sx={{ fontSize: "1rem" }} />}
                label={t("dashboardHero.badges")}
                value={badgesCount}
                color="success"
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Secondary gamification details — demoted to a quieter panel below
          the hero so they don't compete with the next-action callout above. */}
      {hasSecondaryContent && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {badgeShelf && (
            <Box
              sx={{
                px: { xs: 2.5, sm: 4 },
                py: 1.5,
                borderBottom: squad ? "1px solid" : "none",
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
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: { xs: 2.5, sm: 4 },
                py: 1.5,
                bgcolor: "rgba(63,81,181,0.06)",
                ...theme.applyStyles("dark", {
                  bgcolor: "rgba(25,118,210,0.12)",
                }),
                textDecoration: "none",
                "&:hover": {
                  bgcolor: "rgba(63,81,181,0.12)",
                  ...theme.applyStyles("dark", {
                    bgcolor: "rgba(25,118,210,0.2)",
                  }),
                },
              })}
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
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {t("dashboardHero.yourSquad")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {squad.name}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={t("dashboardHero.squadXp", {
                    xp: (squad.totalXP || 0).toLocaleString(),
                  })}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
                <ArrowForwardIcon
                  sx={{ fontSize: "1rem", color: "text.secondary" }}
                />
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
