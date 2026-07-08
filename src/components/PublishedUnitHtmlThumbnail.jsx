"use client";

import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import LazyCardMedia from "./LazyCardMedia";

/**
 * PublishedUnitHtmlThumbnail
 *
 * Displays a pre-rendered thumbnail image captured at publish time.
 * Falls back to featuredImage, then to an empty placeholder.
 */
export default function PublishedUnitHtmlThumbnail({
  unitId,
  thumbnailS3Key,
  fallbackS3Key,
  fallbackIdentityId,
  emptyLabel = "Preview unavailable",
}) {
  const s3Key = thumbnailS3Key || fallbackS3Key;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 96,
        overflow: "hidden",
        borderRadius: 0,
        bgcolor: "background.default",
      }}
    >
      {s3Key ? (
        <LazyCardMedia s3Key={s3Key} identityId={fallbackIdentityId} />
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
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
