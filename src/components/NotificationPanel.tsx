"use client";

/**
 * NotificationPanel — Global sidepanel (Drawer) hosting NotificationList.
 * Mounted once at the app root (see app/providers.tsx) so the notification
 * bell can open it from anywhere instead of navigating to a dedicated page.
 */

import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useNotifications } from "../context/notificationContext";
import NotificationList from "./NotificationList";

export default function NotificationPanel() {
  const t = useTranslations("common");
  const router = useRouter();
  const { panelOpen, closePanel } = useNotifications();

  const handleClose = () => closePanel?.();

  const handleNavigate = (path: string) => {
    handleClose();
    router.push(path);
  };

  return (
    <Drawer anchor="right" open={Boolean(panelOpen)} onClose={handleClose}>
      <Box
        sx={{
          width: { xs: "100vw", sm: 420 },
          height: "100%",
          overflowY: "auto",
        }}
        role="presentation"
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton
            onClick={handleClose}
            aria-label={t("actions.close", "Close")}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <NotificationList onNavigate={handleNavigate} />
      </Box>
    </Drawer>
  );
}

