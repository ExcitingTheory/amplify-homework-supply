"use client";

/**
 * EmptyState — Shared presentational empty-state block.
 *
 * A single, token-driven layout for "nothing here yet" screens (squad feeds,
 * leaderboard tabs, badge walls, drill, etc.) so they stop rendering bare
 * centered text. Fully prop-driven with no app context; callers pass already
 * translated copy and their own action slots.
 *
 * @module EmptyState
 */

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { SxProps, Theme } from "@mui/material/styles";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

export interface EmptyStateProps {
  /** Leading illustration / icon. Defaults to an outlined inbox glyph. */
  icon?: React.ReactNode;
  /** Primary headline. */
  title: React.ReactNode;
  /** Optional supporting copy under the title. */
  description?: React.ReactNode;
  /** Primary call-to-action slot (e.g. a `Button`). */
  action?: React.ReactNode;
  /** Optional secondary action slot rendered next to the primary action. */
  secondaryAction?: React.ReactNode;
  /** Tighter padding for use inside cards/panels. */
  dense?: boolean;
  /** Escape hatch for layout tweaks at the call site. */
  sx?: SxProps<Theme>;
}

/**
 * EmptyState — centered icon + title + optional description and action slots.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  dense = false,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: dense ? 1.5 : 2,
          px: 2,
          py: dense
            ? `${SEMANTIC_THEME.padding.cardDesktop}px`
            : `${SEMANTIC_THEME.padding.panelDesktop}px`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        aria-hidden
        sx={{
          display: "inline-flex",
          color: "text.secondary",
          fontSize: dense ? 40 : 56,
          "& > svg": { fontSize: "inherit" },
        }}
      >
        {icon ?? <InboxOutlinedIcon fontSize="inherit" />}
      </Box>

      <Typography
        variant={dense ? "subtitle1" : "h6"}
        component="p"
        sx={{ fontWeight: SEMANTIC_THEME.typography.headingWeight }}
      >
        {title}
      </Typography>

      {description != null && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 420 }}
        >
          {description}
        </Typography>
      )}

      {(action || secondaryAction) && (
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 0.5, alignItems: "center" }}
        >
          {secondaryAction}
          {action}
        </Stack>
      )}
    </Box>
  );
}

export default EmptyState;
