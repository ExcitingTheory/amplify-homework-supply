"use client";

/**
 * ErrorState — Shared presentational error block.
 *
 * A thin, error-semantics specialization of {@link EmptyState} for recoverable
 * failures (peer-review room not found, failed loads, etc.). Provides an error
 * icon by default and an optional built-in Retry action so callers stop
 * rendering bare pink text. Still fully prop-driven with no app context.
 *
 * @module ErrorState
 */

import React from "react";
import Button from "@mui/material/Button";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { SxProps, Theme } from "@mui/material/styles";
import { EmptyState } from "./EmptyState";

export interface ErrorStateProps {
  /** Leading icon. Defaults to an outlined error glyph tinted with the error color. */
  icon?: React.ReactNode;
  /** Primary headline. */
  title: React.ReactNode;
  /** Optional supporting copy under the title. */
  description?: React.ReactNode;
  /** Primary action slot. Overrides the built-in retry button when provided. */
  action?: React.ReactNode;
  /** Optional secondary action slot. */
  secondaryAction?: React.ReactNode;
  /** Retry handler. Renders a default "Try again" button when `action` is omitted. */
  onRetry?: () => void;
  /** Label for the default retry button. */
  retryLabel?: string;
  /** Tighter padding for use inside cards/panels. */
  dense?: boolean;
  /** Escape hatch for layout tweaks at the call site. */
  sx?: SxProps<Theme>;
}

/**
 * ErrorState — error-tinted icon + title + optional description and recovery CTA.
 */
export function ErrorState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  onRetry,
  retryLabel = "Try again",
  dense = false,
  sx,
}: ErrorStateProps) {
  const resolvedAction =
    action ??
    (onRetry ? (
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
    ) : undefined);

  return (
    <EmptyState
      icon={icon ?? <ErrorOutlineIcon fontSize="inherit" color="error" />}
      title={title}
      description={description}
      action={resolvedAction}
      secondaryAction={secondaryAction}
      dense={dense}
      sx={sx}
    />
  );
}

export default ErrorState;
