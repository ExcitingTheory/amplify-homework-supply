"use client";
import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CardMediaThumbnail from "@/components/CardMediaThumbnail";
import { SEMANTIC_THEME } from "@/themes/semanticTheme";

export interface AssignmentFeedCardProps {
  unitName?: string;
  description?: string;
  dueLabel: string;
  featuredImage?: string;
  identityId?: string;
  workbookUrl: string;
  viewWorkbookLabel: string;
  disabled?: boolean;
  linkedChapter?: { chapterOrder?: number; title: string } | null;
  onOpenChapter?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Instructors only — secondary action on the left, opposite View Workbook. */
  editUnitUrl?: string;
  editUnitLabel?: string;
}

/** Image-left assignment feed card: date above title, a real CTA button, muted icon. */
export function AssignmentFeedCard({
  unitName,
  description,
  dueLabel,
  featuredImage,
  identityId,
  workbookUrl,
  viewWorkbookLabel,
  disabled = false,
  linkedChapter,
  onOpenChapter,
  editUnitUrl,
  editUnitLabel,
}: AssignmentFeedCardProps) {
  return (
    <Card
      data-tour="assignment-card"
      variant="assignment"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        margin: "1rem auto",
        width: "100%",
        maxWidth: "80rem",
        overflow: "hidden",
      }}
    >
      <CardMediaThumbnail s3Key={featuredImage} identityId={identityId} />
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <CardContent sx={{ flex: "1 0 auto" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              mb: 0.5,
            }}
          >
            {dueLabel}
          </Typography>
          <Typography component="div" variant="h5" sx={{ fontWeight: 600 }}>
            {unitName}
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="div"
          >
            {description}
          </Typography>
          {linkedChapter && (
            <Chip
              label={
                linkedChapter.chapterOrder != null
                  ? `Ch. ${linkedChapter.chapterOrder}: ${linkedChapter.title}`
                  : linkedChapter.title
              }
              size="small"
              color="primary"
              variant="outlined"
              clickable
              onClick={(event) => onOpenChapter?.(event)}
              sx={{ mt: 0.75, fontSize: "0.7rem", height: 22 }}
            />
          )}
        </CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            pb: 1.5,
          }}
        >
          {editUnitUrl ? (
            <Button
              variant="text"
              color="inherit"
              href={editUnitUrl}
              disabled={disabled}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              {editUnitLabel}
            </Button>
          ) : (
            <span />
          )}
          <Button
            variant="contained"
            data-tour="view-workbook-button"
            href={workbookUrl}
            disabled={disabled}
            startIcon={<EditNoteIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: `${SEMANTIC_THEME.radius.control}px`,
            }}
          >
            {viewWorkbookLabel}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
