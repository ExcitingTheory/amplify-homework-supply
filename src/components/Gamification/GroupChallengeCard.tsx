/**
 * GroupChallengeCard — Displays a group challenge with progress bar,
 * deadline, and bonus multiplier.
 *
 * @module GroupChallengeCard
 */

import React from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TimerIcon from "@mui/icons-material/Timer";

export interface GroupChallengeCardProps {
  title: string;
  targetXP: number;
  currentXP: number;
  deadline?: string;
  active: boolean;
  bonusMultiplier?: number;
}

function formatTimeRemaining(
  deadline: string,
  t: ReturnType<typeof useTranslations>,
): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return t("groupChallengeCard.expired");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0)
    return t("groupChallengeCard.daysHoursLeft", { days, hours: hours % 24 });
  return t("groupChallengeCard.hoursLeft", { hours });
}

export function GroupChallengeCard({
  title,
  targetXP,
  currentXP,
  deadline,
  active,
  bonusMultiplier = 1.5,
}: GroupChallengeCardProps) {
  const t = useTranslations("components");
  const progress =
    targetXP > 0 ? Math.min(100, Math.round((currentXP / targetXP) * 100)) : 0;
  const goalReached = currentXP >= targetXP;

  return (
    <Card
      variant="panel"
      sx={{
        opacity: active ? 1 : 0.7,
        border: goalReached ? "2px solid" : undefined,
        borderColor: goalReached ? "success.main" : undefined,
      }}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEventsIcon color={goalReached ? "success" : "action"} />
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          {bonusMultiplier > 1 && (
            <Chip
              label={t("groupChallengeCard.bonusMultiplier", {
                bonusMultiplier,
              })}
              size="small"
              variant="status"
              color="warning"
              sx={{ height: 22, fontSize: "0.75rem" }}
            />
          )}
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("groupChallengeCard.xpProgress", {
                currentXP: currentXP.toLocaleString(),
                targetXP: targetXP.toLocaleString(),
              })}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={goalReached ? "success" : "primary"}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {deadline && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TimerIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {formatTimeRemaining(deadline, t)}
              </Typography>
            </Box>
          )}
          {goalReached && (
            <Chip
              label={t("groupChallengeCard.goalReached")}
              size="small"
              variant="status"
              color="success"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          )}
          {!active && !goalReached && (
            <Chip
              label={t("groupChallengeCard.ended")}
              size="small"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default GroupChallengeCard;
