"use client";
import React from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import IconEdit from "@mui/icons-material/Edit";
import CardMediaThumbnail from "@/components/CardMediaThumbnail";
import {
  BadgeShelf,
  type EarnedBadge,
} from "@/components/Gamification/BadgeShelf";
import { SEMANTIC_THEME } from "@/themes/semanticTheme";

const actionButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  px: 3,
  py: 1,
  borderRadius: `${SEMANTIC_THEME.radius.control}px`,
  boxShadow: 2,
  color: "primary.main",
  borderColor: "primary.main",
  "&:hover": {
    boxShadow: 4,
    borderColor: "primary.main",
    backgroundColor: "action.hover",
  },
} as const;

export interface UnitCardProps {
  unit: {
    id: string;
    name?: string;
    description?: string;
    featuredImage?: string;
    identityId?: string;
  };
  badges?: EarnedBadge[];
  disabled?: boolean;
  /** Published units can be practiced; drafts/archived units cannot. */
  showPractice?: boolean;
  onPractice?: () => void;
  labels: {
    untitledUnit: string;
    viewWorkbook: string;
    practice: string;
    editUnit: string;
  };
}

/** Shared unit list-card body — used for the published, draft, and archived unit lists alike. */
export function UnitCard({
  unit,
  badges = [],
  disabled = false,
  showPractice = false,
  onPractice,
  labels,
}: UnitCardProps) {
  return (
    <Card
      id={`unit-${unit.id}`}
      variant="assignment"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        margin: "1rem auto",
        width: "90vw",
        maxWidth: "80rem",
        overflow: "hidden",
      }}
    >
      <CardMediaThumbnail
        s3Key={unit?.featuredImage}
        identityId={unit?.identityId}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          p: 0.5,
        }}
      >
        <CardContent sx={{ flex: "1 0 auto", pb: 1 }}>
          <Typography
            component="div"
            variant="h5"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            {unit.name || labels.untitledUnit}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            component="div"
            sx={{ lineHeight: 1.6 }}
          >
            {unit.description || ""}
          </Typography>
          {badges.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <BadgeShelf earnedBadges={badges} earnedOnly />
            </Box>
          )}
        </CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            pl: 2,
            pb: 1.5,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            href={`/workbook/${unit.id}`}
            disabled={disabled}
            startIcon={<EditNoteIcon />}
            sx={actionButtonSx}
          >
            {labels.viewWorkbook}
          </Button>
          {showPractice && (
            <Button
              variant="outlined"
              disabled={disabled}
              onClick={onPractice}
              startIcon={<FitnessCenterIcon />}
              sx={actionButtonSx}
            >
              {labels.practice}
            </Button>
          )}
          <Button
            variant="outlined"
            href={`/unit/${unit.id}`}
            disabled={disabled}
            startIcon={<IconEdit />}
            sx={actionButtonSx}
          >
            {labels.editUnit}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
