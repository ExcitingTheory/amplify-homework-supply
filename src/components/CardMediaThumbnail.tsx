"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import LazyCardMedia from "./LazyCardMedia";
import { pickTinctures, readableInk } from "@/themes/heraldry";
import { getGrainySheenSx } from "@/utils/grainySheen";

export interface CardMediaThumbnailProps {
  s3Key?: string | null;
  identityId?: string | null;
  fileId?: string | null;
  /** Square side length in px — kept uniform across every card type that uses this component. */
  size?: number;
  /** Fixed desktop width in px when `aspectRatio` is set (defaults to `size`). */
  desktopWidth?: number;
  /** CSS aspect-ratio (e.g. "4/3") for the desktop box; omit to keep the fixed-square default. */
  aspectRatio?: string;
  /** Shown instead of the image when no s3Key is available. Omit to render nothing. */
  emptyLabel?: string;
  /** On sm+, stretch to the row's height (via flex `stretch`) instead of a fixed square — use when the sibling content column has variable height. */
  fillHeight?: boolean;
  /** Unit/course title — when provided (and there's no s3Key), renders a deterministic gradient + monogram instead of plain empty text, so cards never need stock imagery. */
  title?: string;
  /** Keeps the row height fixed at `size` and widens to a 16:9 image at the `lg` breakpoint (computed from that fixed height via CSS `aspect-ratio`) instead of staying a small square as the card grows wider. Not combined with `fillHeight`. */
  wideOnLarge?: boolean;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
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
  desktopWidth,
  aspectRatio,
  emptyLabel,
  fillHeight = false,
  title,
  wideOnLarge = false,
}: CardMediaThumbnailProps) {
  const theme = useTheme();

  if (!s3Key && !emptyLabel && !title) return null;

  return (
    <Box
      sx={{
        width: wideOnLarge
          ? { xs: "100%", sm: "auto" }
          : { xs: "100%", sm: desktopWidth ?? size },
        height: wideOnLarge
          ? { xs: size, sm: size }
          : {
              xs: size,
              sm: fillHeight ? "auto" : aspectRatio ? "auto" : size,
            },
        alignSelf: fillHeight ? { sm: "stretch" } : undefined,
        aspectRatio: wideOnLarge
          ? { sm: aspectRatio ?? "1/1", lg: "16/9" }
          : aspectRatio
            ? { sm: aspectRatio }
            : undefined,
        flexShrink: 0,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {s3Key ? (
        <LazyCardMedia s3Key={s3Key} identityId={identityId} fileId={fileId} />
      ) : title ? (
        (() => {
          const { field, charge } = pickTinctures(title, theme);
          const ink = readableInk(field.main);
          return (
            <Box
              role="img"
              aria-label={emptyLabel || title}
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...getGrainySheenSx(field.main, charge.main),
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: ink, letterSpacing: "0.05em" }}
              >
                {getInitials(title)}
              </Typography>
            </Box>
          );
        })()
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
