"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Box, Card, Chip, Typography } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { DASHBOARD_TOKENS } from "./constants";
import { AssignmentCard, type AssignmentCardProps } from "./AssignmentCard";

interface UpNextCardProps {
  assignment: AssignmentCardProps["assignment"];
  unit: AssignmentCardProps["unit"];
  sectionName: string;
  chapterTitle?: string | null;
  lockStatus?: AssignmentCardProps["lockStatus"];
  /** Grade info for a completed assignment — drives the completed/grade display */
  latestGrade?: AssignmentCardProps["latestGrade"];
  nailedItCount?: number;
  accommodation?: AssignmentCardProps["accommodation"];
  onOpenDrill: AssignmentCardProps["onOpenDrill"];
  onRequestGuidance: AssignmentCardProps["onRequestGuidance"];
}

/**
 * Highlighted hero card for the single most important next step within a section.
 * Wraps AssignmentCard with additional context (section name, chapter).
 */
export function UpNextCard({
  assignment,
  unit,
  sectionName,
  chapterTitle,
  lockStatus,
  latestGrade,
  nailedItCount = 0,
  accommodation,
  onOpenDrill,
  onRequestGuidance,
}: UpNextCardProps) {
  const t = useTranslations("components");
  return (
    <Box
      sx={{
        position: "relative",
        // MUI's sx multiplies bare numeric margin values by theme.spacing()
        // (8) — must be an explicit px string or 24 silently becomes 192.
        mb: `${DASHBOARD_TOKENS.spacing.panelGap}px`,
      }}
    >
      {/* Badge label — kept outside the Card so the card's overflow can stay
          hidden and clip nested elements to its rounded corners. */}
      <Box
        sx={{
          position: "absolute",
          top: -12,
          left: 16,
          zIndex: 1,
        }}
      >
        <Chip
          icon={<RocketLaunchIcon />}
          label={t("upNextCard.badge")}
          color="primary"
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
        />
      </Box>

      <Card
        component="section"
        aria-label={t("upNextCard.ariaLabel", { sectionName })}
        elevation={0}
        sx={{
          // MUI's sx multiplies bare numeric borderRadius by theme.shape.borderRadius
          // (4) \u2014 must be an explicit px string or 8 silently becomes 32.
          borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
          border: "2px solid",
          borderColor: "primary.main",
          borderLeft: `4px solid`,
          borderLeftColor: "primary.main",
          // Clip nested content (the flat-cornered AssignmentCard) to this
          // card's rounded corners instead of letting square edges show.
          overflow: "hidden",
        }}
      >
        <Box aria-live="polite" aria-atomic="false">
          {chapterTitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, pt: 1, display: "block", fontStyle: "italic" }}
            >
              📖 {chapterTitle}
            </Typography>
          )}
          <AssignmentCard
            assignment={assignment}
            unit={unit}
            locked={false}
            lockStatus={lockStatus}
            isUpNext
            latestGrade={latestGrade}
            nailedItCount={nailedItCount}
            accommodation={accommodation}
            onOpenDrill={onOpenDrill}
            onRequestGuidance={onRequestGuidance}
          />
        </Box>
      </Card>
    </Box>
  );
}
