import React from "react";
import { GlobalChatButton } from "./GlobalChatButton";
import { expect } from 'storybook/test'

export default {
  title: "🧩 UI Components/Global Chat Button",
  component: GlobalChatButton,
  parameters: {
    layout: "fullscreen",
  },
};

export const Default = {  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const WithUnreadBadge = {
  args: {
    unreadCount: 3,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ManyUnread = {
  args: {
    unreadCount: 150,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const Hidden = {
  args: {
    show: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
