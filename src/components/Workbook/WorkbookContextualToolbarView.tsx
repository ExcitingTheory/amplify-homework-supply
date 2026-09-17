"use client";

/**
 * WorkbookContextualToolbarView — presentational, context-free rendering of the
 * workbook/editor contextual toolbar (the second app-bar row injected by
 * ToolBarRoPlugin). All app context (unit, workbook provider, grade timer,
 * section accommodations, XP streak) is resolved by the plugin wrapper and
 * passed in as props/slots so this view can be reused directly (e.g. in the
 * Design System Showcase).
 *
 * @module components/Workbook/WorkbookContextualToolbarView
 */

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import TimerIcon from "@mui/icons-material/Timer";
import WifiIcon from "@mui/icons-material/Wifi";
import SyncIcon from "@mui/icons-material/Sync";
import WifiOffIcon from "@mui/icons-material/WifiOff";

import { SEMANTIC_THEME } from "../../themes/semanticTheme";
import { OverflowRevealText } from "./OverflowRevealText";

export type WorkbookConnectionState = "connected" | "syncing" | "offline";

/**
 * Unit identity block injected into the primary app-bar row (MainToolbar
 * children slot) — the real toolbar renders this via toolbarChildrenPortalRef.
 */
export function WorkbookToolbarTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ mx: 1, minWidth: 0, overflow: "hidden" }}>
      <OverflowRevealText
        text={title}
        variant="body1"
        sx={{
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      />
      {description && (
        <OverflowRevealText
          text={description}
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            lineHeight: 1.15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
      )}
    </Box>
  );
}

export interface WorkbookContextualToolbarViewProps {
  /** Search slot — real toolbars pass <GlobalSearchBar />. */
  search?: React.ReactNode;
  /** Countdown string (e.g. "19:58"). Omit to hide the timer. */
  timeString?: string;
  /** Realtime collaboration connection state. Omit to hide the chip. */
  connection?: WorkbookConnectionState;
  /** Join code copied on click in the real ConnectionStatus. */
  joinCode?: string;
  /** Completed graded blocks. */
  finishedQuestions?: number;
  /** Total graded blocks. */
  totalQuestions?: number;
  /** Compact (scrolled) density. */
  compact?: boolean;
}

const chipSx = { borderRadius: `${SEMANTIC_THEME.radius.chip}px` } as const;

const CONNECTION_META: Record<
  WorkbookConnectionState,
  {
    icon: React.ReactElement;
    label: string;
    color: "success" | "warning" | "default";
  }
> = {
  connected: { icon: <WifiIcon />, label: "Connected", color: "success" },
  syncing: { icon: <SyncIcon />, label: "Syncing…", color: "warning" },
  offline: { icon: <WifiOffIcon />, label: "Offline", color: "default" },
};

export function WorkbookContextualToolbarView({
  search,
  timeString,
  connection,
  joinCode,
  finishedQuestions = 0,
  totalQuestions = 0,
  compact = false,
}: WorkbookContextualToolbarViewProps) {
  const size = compact ? "small" : "medium";
  const conn = connection ? CONNECTION_META[connection] : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: { xs: "column", sm: "row" },
        gap: 1,
        width: "100%",
        px: 1.5,
        py: 0.5,
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {search != null && (
        <Box
          sx={{
            flex: { xs: "0 0 auto", sm: "1 1 18rem" },
            width: { xs: "100%", sm: "auto" },
            minWidth: 0,
            "& .MuiBox-root": { maxWidth: { xs: "none", sm: 400 } },
          }}
        >
          {search}
        </Box>
      )}

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          flexShrink: 0,
          minWidth: 0,
          width: { xs: "100%", sm: "auto" },
          ml: { sm: "auto" },
          justifyContent: { xs: "flex-end", sm: "initial" },
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {timeString != null && (
          <Chip
            icon={<TimerIcon />}
            label={timeString}
            color="primary"
            size={size}
            sx={chipSx}
          />
        )}

        <Chip
          label={`${finishedQuestions} of ${totalQuestions} Questions Completed`}
          variant="outlined"
          size={size}
          sx={chipSx}
        />

        {conn && (
          <Tooltip
            arrow
            title={
              joinCode ? `${conn.label} · Join code ${joinCode}` : conn.label
            }
          >
            <IconButton
              size="small"
              aria-label={conn.label}
              sx={{ color: "text.secondary" }}
            >
              {conn.icon}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

export default WorkbookContextualToolbarView;
