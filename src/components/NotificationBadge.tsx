/**
 * NotificationBadge — Wraps children with an MUI Badge showing unseen
 * notification count, optionally filtered by category.
 *
 * @example
 * <NotificationBadge category="COLLABORATION">
 *   <GroupsIcon />
 * </NotificationBadge>
 */

import React from "react";
import Badge from "@mui/material/Badge";
import type { BadgeProps } from "@mui/material/Badge";
import { useUnseenCount } from "../context/notificationContext";

interface NotificationBadgeProps extends Omit<BadgeProps, "badgeContent"> {
  category?: string;
  children: React.ReactNode;
}

export default function NotificationBadge({
  category,
  children,
  ...badgeProps
}: NotificationBadgeProps) {
  const count = useUnseenCount(category);

  if (count === 0) return <>{children}</>;

  return (
    <Badge
      badgeContent={count}
      color="error"
      max={99}
      overlap="rectangular"
      {...badgeProps}
    >
      {children}
    </Badge>
  );
}
