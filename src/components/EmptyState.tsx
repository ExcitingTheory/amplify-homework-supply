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
import MuiLink from "@mui/material/Link";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { SxProps, Theme } from "@mui/material/styles";
import { Link as LocaleLink } from "@/i18n/navigation";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

const EXTERNAL_HREF = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

export interface EmptyStateProps {
  /** Leading illustration / icon. Defaults to an outlined inbox glyph. Accepts any svg icon, including react-icons. */
  icon?: React.ReactNode;
  /** Primary headline. */
  title: React.ReactNode;
  /** Optional supporting copy under the title. */
  description?: React.ReactNode;
  /** Primary call-to-action slot (e.g. a `Button`). */
  action?: React.ReactNode;
  /** Optional secondary action slot rendered next to the primary action. */
  secondaryAction?: React.ReactNode;
  /** Convenience text-link CTA, rendered after `action`/`secondaryAction`. */
  ctaLabel?: React.ReactNode;
  /**
   * Href for the convenience link CTA. Root-relative paths are navigated through
   * the locale-aware router; absolute URLs render a plain anchor. Omit and use
   * `onCtaClick` for a button-like link instead.
   */
  ctaHref?: string;
  onCtaClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Tighter padding for use inside cards/panels. */
  dense?: boolean;
  /** Escape hatch for layout tweaks at the call site. */
  sx?: SxProps<Theme>;
  /** Wire up native drag-and-drop on the root — pass handlers to accept dropped files. */
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  /** Highlights the dashed border while a drag is in progress over this target. */
  isDragActive?: boolean;
}

/**
 * EmptyState — centered icon + title + optional description and action slots.
 * Every instance renders the same dashed border + rounded corners so "nothing
 * here yet" and drag-and-drop targets look consistent across the app.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  ctaLabel,
  ctaHref,
  onCtaClick,
  dense = false,
  sx,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragActive = false,
}: EmptyStateProps) {
  const isDropzone = Boolean(onDragOver || onDrop);
  const ctaLinkProps = !ctaHref
    ? ({ component: "button", type: "button" } as const)
    : EXTERNAL_HREF.test(ctaHref)
      ? ({ component: "a", href: ctaHref } as const)
      : ({ component: LocaleLink, href: ctaHref } as const);

  return (
    <Box
      {...(isDropzone && { onDragOver, onDragLeave, onDrop })}
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
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "divider",
          borderRadius: `${SEMANTIC_THEME.radius.card}px`,
          transition: "border-color 0.15s ease",
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

      {ctaLabel != null && (
        <MuiLink
          {...ctaLinkProps}
          onClick={onCtaClick}
          underline="hover"
          sx={{ fontWeight: 600, mt: action || secondaryAction ? 0 : 0.5 }}
        >
          {ctaLabel}
        </MuiLink>
      )}
    </Box>
  );
}

export default EmptyState;
