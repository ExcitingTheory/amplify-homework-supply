/**
 * NotificationInvitations — Shows pending invitation notifications filtered by type.
 * Used inside join dialogs to display relevant invitations from the notification feed.
 */

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNotifications } from "../../context/notificationContext";

interface NotificationInvitationsProps {
  /** Notification types to filter by (e.g., ["PEER_REVIEW_INVITE", "PRACTICE_SESSION_INVITE"]) */
  types: string[];
  /** Called when user clicks Join on an invitation */
  onJoin: (notification: any) => void;
  /** Label for the join button */
  joinLabel?: string;
  /** Empty state message */
  emptyMessage?: string;
}

export default function NotificationInvitations({
  types,
  onJoin,
  joinLabel = "Join",
  emptyMessage = "No pending invitations",
}: NotificationInvitationsProps) {
  const { notifications, loading, markInteracted } = useNotifications();

  const invitations = useMemo(() => {
    return notifications.filter(
      (n) => typeof n.type === "string" && types.includes(n.type) && !n.interacted,
    );
  }, [notifications, types]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={48} />
      </Box>
    );
  }

  if (invitations.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 3,
          px: 2,
        }}
      >
        <NotificationsNoneIcon
          sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List dense>
      {invitations.map((notification) => (
        <ListItem key={notification.id} divider>
          <ListItemText
            primary={notification.title}
            secondary={
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                {notification.senderName && (
                  <span>From: {notification.senderName}</span>
                )}
                {notification.body && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    component="span"
                    sx={{ ml: 1 }}
                  >
                    {notification.body}
                  </Typography>
                )}
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {!notification.seen && (
                <Chip label="New" size="small" color="primary" />
              )}
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  markInteracted(notification.id);
                  onJoin(notification);
                }}
              >
                {joinLabel}
              </Button>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
