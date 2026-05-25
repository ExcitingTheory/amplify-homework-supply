/**
 * NotificationList — Filterable list of notifications with category tabs,
 * "mark all as read" button, and empty state.
 */

import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useTranslations } from "next-intl";
import { useNotifications } from "../context/notificationContext";
import NotificationCard from "./NotificationCard";

const CATEGORIES = [
  "ALL",
  "ASSIGNMENT",
  "COLLABORATION",
  "GAMIFICATION",
  "SQUAD",
  "CHAT",
  "SYSTEM",
];

export default function NotificationList({ onNavigate }) {
  const t = useTranslations("components");
  const {
    notifications,
    unseenCount,
    unseenByCategory,
    loading,
    markSeen,
    markInteracted,
    markAllSeen,
    deleteNotification,
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState(0);

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 0) return notifications;
    const cat = CATEGORIES[selectedCategory];
    return notifications.filter((n) => n.category === cat);
  }, [notifications, selectedCategory]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={72}
            sx={{ borderRadius: 1, mb: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5">
            {t("notification.title", "Notifications")}
          </Typography>
          {unseenCount > 0 && (
            <Chip
              label={unseenCount}
              size="small"
              color="error"
            />
          )}
        </Box>
        {unseenCount > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={markAllSeen}
          >
            {t("notification.markAllRead", "Mark all read")}
          </Button>
        )}
      </Box>

      {/* Category tabs */}
      <Tabs
        value={selectedCategory}
        onChange={(_, v) => setSelectedCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {CATEGORIES.map((cat, i) => {
          const count =
            cat === "ALL" ? unseenCount : unseenByCategory[cat] || 0;
          return (
            <Tab
              key={cat}
              label={
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  {t(`notification.category.${cat.toLowerCase()}`, cat)}
                  {count > 0 && (
                    <Chip
                      label={count}
                      size="small"
                      color="error"
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                  )}
                </Box>
              }
            />
          );
        })}
      </Tabs>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 6,
            px: 2,
          }}
        >
          <NotificationsNoneIcon
            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary">
            {t("notification.empty", "No notifications yet")}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {t(
              "notification.emptyDescription",
              "You'll see notifications for assignments, grades, badges, and more here.",
            )}
          </Typography>
        </Box>
      ) : (
        <Box>
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkSeen={markSeen}
              onMarkInteracted={markInteracted}
              onDelete={deleteNotification}
              onNavigate={onNavigate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
