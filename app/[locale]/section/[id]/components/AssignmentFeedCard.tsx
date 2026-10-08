"use client";
import React from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
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

/** Flat, compact assignment row: small icon, one-line title/meta, single CTA — no imagery, shadow, or hover motion. */
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
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        margin: "0.5rem auto",
        width: "100%",
        maxWidth: "80rem",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: `${SEMANTIC_THEME.radius.card}px`,
      }}
    >
      <CardMediaThumbnail
        title={unitName}
        size={48}
        desktopWidth={96}
        fillHeight
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
          p: 1.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              component="div"
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 600 }}
            >
              {unitName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ flexShrink: 0, textTransform: "uppercase" }}
            >
              {dueLabel}
            </Typography>
          </Box>
          {description && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {description}
            </Typography>
          )}
          {linkedChapter && (
            <Chip
              label={
                linkedChapter.chapterOrder != null
                  ? `Ch. ${linkedChapter.chapterOrder}: ${linkedChapter.title}`
                  : linkedChapter.title
              }
              size="small"
              variant="outlined"
              clickable
              onClick={(event) => onOpenChapter?.(event)}
              sx={{ mt: 0.5, fontSize: "0.7rem", height: 20 }}
            />
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {editUnitUrl && (
            <Button
              variant="text"
              size="small"
              color="inherit"
              href={editUnitUrl}
              disabled={disabled}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              {editUnitLabel}
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            data-tour="view-workbook-button"
            href={workbookUrl}
            disabled={disabled}
            startIcon={<EditNoteIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
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
