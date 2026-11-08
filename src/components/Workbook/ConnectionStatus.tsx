/**
 * Connection Status Indicator
 *
 * Shows the real-time collaboration connection status.
 */

import React from "react";
import { Chip, Tooltip } from "@mui/material";
import { Wifi, WifiOff, Sync } from "@mui/icons-material";
import UnitContext from "../../context/unitContext";
import { SEMANTIC_THEME } from "../../themes/semanticTheme";

export interface ConnectionStatusProps {
  /**
   * Size of the status chip
   * @default 'small'
   */
  size?: "small" | "medium";

  /**
   * Show label text or just icon
   * @default true
   */
  showLabel?: boolean;
}

export function ConnectionStatus({
  size = "small",
  showLabel = true,
}: ConnectionStatusProps) {
  const { workbook, workbookEnabled } = React.useContext(UnitContext);

  // Don't show if feature disabled or no workbook provider
  if (!workbookEnabled || !workbook?.provider) {
    return null;
  }

  const chipSx = {
    borderRadius: `${SEMANTIC_THEME.radius.chip}px`,
    "& .MuiChip-icon": { fontSize: size === "small" ? 16 : 20 },
    minWidth: showLabel ? "auto" : "32px",
  };

  const label = !workbook.isConnected
    ? "Offline"
    : !workbook.isSynced
      ? "Syncing..."
      : "Connected";
  const icon = !workbook.isConnected ? (
    <WifiOff />
  ) : !workbook.isSynced ? (
    <Sync
      sx={{
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      }}
    />
  ) : (
    <Wifi />
  );

  return (
    <Tooltip title={label} arrow>
      <Chip
        icon={icon}
        label={showLabel ? label : undefined}
        aria-label={label}
        variant="outlined"
        size={size}
        sx={chipSx}
      />
    </Tooltip>
  );
}

export default ConnectionStatus;
