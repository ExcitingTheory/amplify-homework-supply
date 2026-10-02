"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LazyCardMedia from "./LazyCardMedia";

export interface CardMediaThumbnailProps {
  s3Key?: string | null;
  identityId?: string | null;
  fileId?: string | null;
  /** Square side length in px — kept uniform across every card type that uses this component. */
  size?: number;
  /** Shown instead of the image when no s3Key is available. Omit to render nothing. */
  emptyLabel?: string;
}

/**
 * Single reusable thumbnail slot: fixed square size on tablet/desktop where it
 * sits left of the card body; full-width on mobile where it stacks on top.
 * Replaces the ad-hoc image wrapper markup that used to be duplicated (and
 * inconsistently ordered/sized) across every card component.
 */
export default function CardMediaThumbnail({
  s3Key,
  identityId,
  fileId,
  size = 160,
  emptyLabel,
}: CardMediaThumbnailProps) {
  if (!s3Key && !emptyLabel) return null;

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: size },
        height: size,
        flexShrink: 0,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {s3Key ? (
        <LazyCardMedia s3Key={s3Key} identityId={identityId} fileId={fileId} />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 1,
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {emptyLabel}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
