/**
 * NotificationCard — Single notification display with visual distinction
 * for unseen/seen/interacted states.
 */

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CampaignIcon from "@mui/icons-material/Campaign";
import ChatIcon from "@mui/icons-material/Chat";
import InfoIcon from "@mui/icons-material/Info";
import GavelIcon from "@mui/icons-material/Gavel";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslations } from "next-intl";

type NotificationCategoryKey = keyof typeof CATEGORY_ICONS;
interface NotificationCardItem {
  id: string;
  category?: string | null;
  title?: string;
  body?: string;
  linkPath?: string;
  linkLabel?: string;
  senderName?: string;
  seen?: boolean;
  interacted?: boolean;
  createdAt?: string;
  hiddenAt?: string | null;
}

interface NotificationCardProps {
  notification: NotificationCardItem;
  onMarkSeen?: (notificationId: string) => void;
  onMarkInteracted?: (notificationId: string) => void;
  /** Soft-delete (move to recycle bin). Ignored when onRestore/onDeleteForever are provided. */
  onDelete?: (notificationId: string) => void;
  onNavigate?: (path: string) => void;
  /** Recycle-bin variant: restore this notification back to the inbox. */
  onRestore?: (notificationId: string) => void;
  /** Recycle-bin variant: permanently delete this notification (irreversible). */
  onDeleteForever?: (notificationId: string) => void;
  /** Multi-select mode: shows a checkbox and routes clicks to selection instead of navigation. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (notificationId: string) => void;
}

const CATEGORY_ICONS = {
  ASSIGNMENT: AssignmentIcon,
  COLLABORATION: GroupsIcon,
  GAMIFICATION: EmojiEventsIcon,
  MODERATION: GavelIcon,
  SQUAD: CampaignIcon,
  GUILD: ShieldIcon,
  CHAT: ChatIcon,
  SYSTEM: InfoIcon,
};

const CATEGORY_COLORS = {
  ASSIGNMENT: "primary",
  COLLABORATION: "secondary",
  GAMIFICATION: "warning",
  MODERATION: "error",
  SQUAD: "info",
  GUILD: "secondary",
  CHAT: "default",
  SYSTEM: "error",
} as const;

function timeAgo(
  t: ReturnType<typeof useTranslations>,
  dateString?: string,
): string {
  if (!dateString) return t("notification.justNow");
  const now = Date.now();
  const dateMs = new Date(dateString).getTime();
  if (!Number.isFinite(dateMs)) return t("notification.justNow");
  const diffMs = now - dateMs;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("notification.justNow");
  if (diffMin < 60) return t("notification.minutesAgo", { count: diffMin });
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return t("notification.hoursAgo", { count: diffHrs });
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return t("notification.daysAgo", { count: diffDays });
  return new Date(dateMs).toLocaleDateString();
}

export default function NotificationCard({
  notification,
  onMarkSeen,
  onMarkInteracted,
  onDelete,
  onNavigate,
  onRestore,
  onDeleteForever,
  selectable = false,
  selected = false,
  onToggleSelect,
}: NotificationCardProps) {
  const t = useTranslations("components");
  const categoryKey = (notification.category || "SYSTEM") as NotificationCategoryKey;
  const Icon = CATEGORY_ICONS[categoryKey] || InfoIcon;
  const chipColor = CATEGORY_COLORS[categoryKey] || "default";
  const isRecycleBinVariant = Boolean(onRestore || onDeleteForever);

  const isUnseen = !notification.seen;
  const isInteracted = notification.interacted;

  const handleClick = () => {
    if (selectable) {
      onToggleSelect?.(notification.id);
      return;
    }
    if (isRecycleBinVariant) return;
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
        opacity: isInteracted && !isRecycleBinVariant ? 0.7 : 1,
        cursor: selectable || (notification.linkPath && !isRecycleBinVariant) ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "action.hover",
        },
        borderBottom: 1,
        borderBottomColor: "divider",
      }}
    >
      {selectable && (
        <Checkbox
          size="small"
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect?.(notification.id)}
          sx={{ mt: -0.25, p: 0.25 }}
        />
      )}
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
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 0.5,
            mb: 0.25,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: isUnseen ? 700 : isInteracted ? 400 : 500,
              color: isInteracted ? "text.secondary" : "text.primary",
              flex: 1,
              minWidth: 0,
              wordBreak: "break-word",
            }}
          >
            {notification.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {timeAgo(t, notification.createdAt)}
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
          sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}
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
              {t("notification.fromSender", {
                sender: notification.senderName,
              })}
            </Typography>
          )}
        </Box>
      </Box>

      {isRecycleBinVariant ? (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {onRestore && (
            <Tooltip title={t("notification.restore")}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(notification.id);
                }}
                sx={{ mt: 0.25 }}
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDeleteForever && (
            <Tooltip title={t("notification.deletePermanently")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteForever(notification.id);
                }}
                sx={{ mt: 0.25 }}
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ) : (
        onDelete && (
          <Tooltip title={t("notification.delete")}>
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
        )
      )}
    </Box>
  );
}
