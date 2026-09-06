"use client";

import { Button } from "@mui/material";
import { Refresh } from "@mui/icons-material";

export function RefreshButton() {
  return (
    <Button
      data-testid="offline-retry-button"
      variant="outlined"
      startIcon={<Refresh />}
      onClick={() => window.location.reload()}
    >
      Try again
    </Button>
  );
}
