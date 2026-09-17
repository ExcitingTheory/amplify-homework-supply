"use client";

/**
 * OfflineBannerView — Presentational offline / reconnecting banner content.
 *
 * Renders just the MUI `Alert` (no Snackbar wrapper) so it can be shown inline
 * without the network/service-worker plumbing the OfflineBanner container owns.
 *
 * @module OfflineBannerView
 */

import React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { WifiOff, CloudSync } from "@mui/icons-material";
import { useTranslations } from "next-intl";

export interface OfflineBannerViewProps {
  variant: "offline" | "reconnecting";
  pendingCount: number;
  onSync: () => void;
}

export const OfflineBannerView = React.forwardRef<
  HTMLDivElement,
  OfflineBannerViewProps
>(function OfflineBannerView({ variant, pendingCount, onSync, ...rest }, ref) {
  const t = useTranslations("components");

  if (variant === "reconnecting") {
    return (
      <Alert
        ref={ref}
        {...rest}
        severity="success"
        icon={<CloudSync />}
        action={
          <Button color="inherit" size="small" onClick={onSync}>
            {t("offlineBanner.syncNow")}
          </Button>
        }
        sx={{ width: "100%" }}
      >
        {t("offlineBanner.backOnline", { count: pendingCount })}
      </Alert>
    );
  }

  return (
    <Alert
      ref={ref}
      {...rest}
      severity="warning"
      icon={<WifiOff />}
      action={
        pendingCount > 0 ? (
          <Button
            color="inherit"
            size="small"
            startIcon={<CloudSync />}
            onClick={onSync}
            aria-label={t("offlineBanner.syncAria", { count: pendingCount })}
          >
            {t("offlineBanner.pending", { count: pendingCount })}
          </Button>
        ) : undefined
      }
      sx={{ width: "100%" }}
    >
      {t("offlineBanner.offline")}
    </Alert>
  );
});

export default OfflineBannerView;
