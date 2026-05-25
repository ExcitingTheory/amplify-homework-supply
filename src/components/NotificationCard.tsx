/**
 * NotificationCard — Single notification display with visual distinction
 * for unseen/seen/interacted states.
 */

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CampaignIcon from "@mui/icons-material/Campaign";
import ChatIcon from "@mui/icons-material/Chat";
import InfoIcon from "@mui/icons-material/Info";
import { useTranslations } from "next-intl";

const CATEGORY_ICONS = {
  ASSIGNMENT: AssignmentIcon,
  COLLABORATION: GroupsIcon,
  GAMIFICATION: EmojiEventsIcon,
  SQUAD: CampaignIcon,
  CHAT: ChatIcon,
  SYSTEM: InfoIcon,
};

const CATEGORY_COLORS = {
  ASSIGNMENT: "primary",
  COLLABORATION: "secondary",
  GAMIFICATION: "warning",
  SQUAD: "info",
  CHAT: "default",
  SYSTEM: "error",
};

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationCard({
  notification,
  onMarkSeen,
  onMarkInteracted,
  onDelete,
  onNavigate,
}) {
  const t = useTranslations("components");
  const Icon =
    CATEGORY_ICONS[notification.category] || InfoIcon;
  const chipColor = CATEGORY_COLORS[notification.category] || "default";

  const isUnseen = !notification.seen;
  const isInteracted = notification.interacted;

  const handleClick = () => {
    if (!notification.seen && onMarkSeen) {
      onMarkSeen(notification.id);
    }
    if (notification.linkPath && onNavigate) {
      if (onMarkInteracted) onMarkInteracted(notification.id);
      onNavigate(notification.linkPath);
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.5,
        borderLeft: isUnseen
          ? "4px solid"
          : "4px solid transparent",
        borderLeftColor: isUnseen ? "primary.main" : "transparent",
        backgroundColor: isUnseen
          ? "action.hover"
          : "transparent",
        opacity: isInteracted ? 0.7 : 1,
        cursor: notification.linkPath ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "action.hover",
        },
        borderBottom: 1,
        borderBottomColor: "divider",
      }}
    >
      <Icon
        sx={{
          color: isUnseen ? `${chipColor}.main` : "text.secondary",
          mt: 0.5,
          fontSize: "1.3rem",
        }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 0.25,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: isUnseen ? 700 : isInteracted ? 400 : 500,
              color: isInteracted ? "text.secondary" : "text.primary",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {notification.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {timeAgo(notification.createdAt)}
          </Typography>
        </Box>

        {notification.body && (
          <Typography
            variant="caption"
            color={isInteracted ? "text.disabled" : "text.secondary"}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notification.body}
          </Typography>
        )}

        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
        >
          <Chip
            label={notification.category}
            size="small"
            color={chipColor}
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 20 }}
          />
          {notification.linkPath && notification.linkLabel && (
            <Button
              size="small"
              variant="text"
              sx={{ fontSize: "0.7rem", minWidth: 0, p: "2px 6px" }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {notification.linkLabel}
            </Button>
          )}
          {notification.senderName && (
            <Typography variant="caption" color="text.disabled">
              from {notification.senderName}
            </Typography>
          )}
        </Box>
      </Box>

      {onDelete && (
        <Tooltip title={t("notification.delete", "Delete")}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            sx={{ mt: 0.25 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
