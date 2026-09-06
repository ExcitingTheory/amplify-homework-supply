import React from "react";
import { GlobalChatDrawer } from "./GlobalChatDrawer";
import ChatContext from "../context/chatContext";
import { expect, within } from "storybook/test";

// Browser-mode tests here occasionally hit a Playwright/websocket disconnect
// ("[birpc] rpc is closed") unrelated to this story's assertions. Retry just
// this file's tests to absorb that flakiness. No-op outside the Vitest runtime.
if (typeof vi !== "undefined") {
  vi.setConfig({ retry: 1 });
}

export default {
  title: "🧩 UI Components/Global Chat Drawer",
  component: GlobalChatDrawer,
  parameters: {
    layout: "fullscreen",
  },
};

// Default story with chat closed — drawer is hidden
export const Closed = {
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

// Open drawer — override ChatContext to start with isChatOpen: true
export const Open = {
  decorators: [
    (Story) => (
      <ChatContext.Provider
        value={{
          isChatOpen: true,
          setIsChatOpen: () => {},
          chats: [],
          currentChat: null,
          setCurrentChat: () => {},
          dispatch: () => {},
        }}
      >
        <Story />
      </ChatContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    // Drawer visible when chat is open
    const body = within(document.body);
    const drawer = document.body.querySelector(
      '[role="presentation"], .MuiDrawer-root',
    );
    expect(drawer).not.toBeNull();
  },
};

export const NarrowWidth = {
  args: {
    width: 320,
  },
  decorators: [
    (Story) => (
      <ChatContext.Provider
        value={{
          isChatOpen: true,
          setIsChatOpen: () => {},
          chats: [],
          currentChat: null,
          setCurrentChat: () => {},
          dispatch: () => {},
        }}
      >
        <Story />
      </ChatContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const drawer = document.body.querySelector(
      '[role="presentation"], .MuiDrawer-root',
    );
    expect(drawer).not.toBeNull();
  },
};
