"use client";
import React from "react";
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
  onOpenDrill,
  onRequestGuidance,
}: UpNextCardProps) {
  return (
    <Card
      component="section"
      aria-label={`Your next step in ${sectionName}`}
      elevation={0}
      sx={{
        mb: DASHBOARD_TOKENS.spacing.panelGap,
        borderRadius: DASHBOARD_TOKENS.radius.card,
        border: "2px solid",
        borderColor: "primary.main",
        borderLeft: `4px solid`,
        borderLeftColor: "primary.main",
        overflow: "visible",
        position: "relative",
      }}
    >
      {/* Badge label */}
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
          label="Up Next"
          color="primary"
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
        />
      </Box>

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
          onOpenDrill={onOpenDrill}
          onRequestGuidance={onRequestGuidance}
        />
      </Box>
    </Card>
  );
}
