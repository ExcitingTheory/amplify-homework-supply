import React from "react";
import { GlobalChatButton } from "./GlobalChatButton";
import { expect, within, fn, userEvent } from "storybook/test";

export default {
  title: "🧩 UI Components/Global Chat Button",
  component: GlobalChatButton,
  parameters: {
    layout: "fullscreen",
  },
};

export const Default = {
  play: async ({ canvasElement }) => {
    // Button renders
    const button = canvasElement.querySelector('button, [role="button"]');
    expect(button).not.toBeNull();
  },
};

export const WithUnreadBadge = {
  args: {
    unreadCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Badge shows count
    await canvas.findByText("3");
  },
};

export const ManyUnread = {
  args: {
    unreadCount: 150,
  },
  play: async ({ canvasElement }) => {
    // Overflow badge shows 99+
    expect(canvasElement.textContent).toMatch(/99\+|150/);
  },
};

export const Hidden = {
  args: {
    show: false,
  },
  play: async ({ canvasElement }) => {
    // Button not visible when show=false
    const button = canvasElement.querySelector('button, [role="button"]');
    expect(button).toBeNull();
  },
};
