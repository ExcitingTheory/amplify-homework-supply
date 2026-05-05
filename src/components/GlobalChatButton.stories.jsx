import React from "react";
import { GlobalChatButton } from "./GlobalChatButton";

export default {
  title: "🧩 UI Components/Global Chat Button",
  component: GlobalChatButton,
  parameters: {
    layout: "fullscreen",
  },
};

export const Default = {};

export const WithUnreadBadge = {
  args: {
    unreadCount: 3,
  },
};

export const ManyUnread = {
  args: {
    unreadCount: 150,
  },
};

export const Hidden = {
  args: {
    show: false,
  },
};
