import React from "react";
import { GlobalChatDrawer } from "./GlobalChatDrawer";
import ChatContext from "../context/chatContext";

export default {
  title: "🧩 UI Components/Global Chat Drawer",
  component: GlobalChatDrawer,
  parameters: {
    layout: "fullscreen",
  },
};

// Default story with chat closed — drawer is hidden
export const Closed = {};

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
};
