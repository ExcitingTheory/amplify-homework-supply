import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface CampaignChapter {
  id: string;
  title: string;
  setting?: string;
  stakes?: string;
  targetXP: number;
  currentXP: number;
  active: boolean;
  chapterOrder?: number;
}

export interface CampaignTimelineProps {
  chapters: CampaignChapter[];
  /** Compact mode: hides title, reduces spacing, and omits narrative setting text */
  compact?: boolean;
}

/**
 * CampaignTimeline — Visual chapter progression for group challenges.
 * Shows completed, in-progress, and locked chapters in order.
 */
export function CampaignTimeline({
  chapters,
  compact = false,
}: CampaignTimelineProps) {
  const t = useTranslations("components");
  const reducedMotion = useReducedMotion();
  if (!chapters || chapters.length === 0) return null;

  // Sort by chapterOrder, then by creation order
  const sorted = [...chapters].sort((a, b) => {
    if (a.chapterOrder != null && b.chapterOrder != null) {
      return a.chapterOrder - b.chapterOrder;
    }
    return 0;
  });

  return (
    <Box
      sx={{ py: compact ? 0.5 : 2 }}
      aria-label={t("campaignTimeline.ariaLabel", { count: sorted.length })}
    >
      {!compact && (
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {t("campaignTimeline.title")}
        </Typography>
      )}
      <Stack spacing={compact ? 0.75 : 1.5}>
        {sorted.map((chapter, index) => {
          const progress =
            chapter.targetXP > 0
              ? Math.min(
                  100,
                  Math.round((chapter.currentXP / chapter.targetXP) * 100),
                )
              : 0;
          const isCompleted = chapter.currentXP >= chapter.targetXP;
          const isActive = chapter.active && !isCompleted;
          const isLocked = !chapter.active && !isCompleted;
          const chapterNumber = index + 1;
          const stateLabel = isCompleted
            ? t("campaignTimeline.chapterCompleteLabel", {
                number: chapterNumber,
                title: chapter.title,
              })
            : isActive
              ? t("campaignTimeline.chapterInProgressLabel", {
                  number: chapterNumber,
                  title: chapter.title,
                  progress,
                })
              : t("campaignTimeline.chapterLockedLabel", {
                  number: chapterNumber,
                  title: chapter.title,
                });

          return (
            <Box
              key={chapter.id}
              aria-label={stateLabel}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: compact ? 1 : 1.5,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Chapter number/icon */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isCompleted
                    ? "success.main"
                    : isActive
                      ? "primary.main"
                      : "grey.300",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <CheckCircleIcon fontSize="small" />
                ) : isLocked ? (
                  <LockIcon fontSize="small" />
                ) : (
                  <PlayArrowIcon fontSize="small" />
                )}
              </Box>

              {/* Chapter content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant={compact ? "caption" : "body2"}
                    fontWeight={600}
                    noWrap
                  >
                    {t("campaignTimeline.chapterTitle", {
                      number: chapterNumber,
                      title: chapter.title,
                    })}
                  </Typography>
                  {isCompleted && (
                    <Chip
                      label={t("campaignTimeline.complete")}
                      size="small"
                      variant="status"
                      color="success"
                      sx={{ height: 18, fontSize: "0.6rem" }}
                    />
                  )}
                  {isActive && (
                    <Chip
                      label={t("campaignTimeline.progressPercent", {
                        progress,
                      })}
                      size="small"
                      variant="status"
                      color="primary"
                      sx={{ height: 18, fontSize: "0.6rem" }}
                    />
                  )}
                  {isLocked && (
                    <Chip
                      label={t("campaignTimeline.locked")}
                      size="small"
                      sx={{ height: 18, fontSize: "0.6rem" }}
                    />
                  )}
                </Box>
                {isActive && (
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      mt: 0.5,
                      height: compact ? 4 : 6,
                      borderRadius: 3,
                      transition: reducedMotion ? "none" : undefined,
                    }}
                  />
                )}
                {!compact && chapter.setting && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {chapter.setting}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default CampaignTimeline;
