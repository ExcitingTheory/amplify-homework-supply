import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { AvatarEditor } from "./AvatarEditor";
import SettingsContext from "../context/settingsContext";

const mockSettingsProvider = (metadata: Record<string, unknown> = {}) => ({
  settings: { metadata },
  updateSettings: fn().mockResolvedValue(undefined),
});

// Mock useXP
vi.mock("../context/gamificationContext", () => ({
  useXP: () => ({
    level: {
      level: 4,
      label: "Expert",
      xpRequired: 0,
      xpForNextLevel: 100,
      progress: 0,
    },
    avatarUnlockConfig: null,
    totalXP: 400,
    sectionXP: 100,
    sectionLevel: {
      level: 2,
      label: "Intermediate",
      xpRequired: 100,
      xpForNextLevel: 200,
      progress: 0.5,
    },
    xpLogs: [],
    isLoading: false,
  }),
  GamificationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import { vi } from "vitest";

const meta: Meta<typeof AvatarEditor> = {
  title: "🏆 Gamification/Avatars & Cosmetics/Avatar Editor",
  component: AvatarEditor,
  args: {
    onSave: fn(),
    seed: "demo-student",
  },
  decorators: [
    (Story) => (
      <SettingsContext.Provider value={mockSettingsProvider() as any}>
        <Story />
      </SettingsContext.Provider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof AvatarEditor>;

/** Default state — shows DiceBear avatar with customize button. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("img");
  },
};

/** Level 1 — only Avataaars Neutral style available. */
export const Level1: Story = {
  args: { level: 1, seed: "student-newbie" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("img");
  },
};

/** Level 2 — Avataaars (detailed) style. */
export const Level2Detailed: Story = {
  args: { level: 2, seed: "student-mid" },
  decorators: [
    (Story) => (
      <SettingsContext.Provider
        value={mockSettingsProvider({ avatarStyle: "detailed" }) as any}
      >
        <Story />
      </SettingsContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("img");
  },
};

/** Level 3 — All styles unlocked including Toon Head. */
export const Level3ToonHead: Story = {
  args: { level: 3, seed: "student-pro" },
  decorators: [
    (Story) => (
      <SettingsContext.Provider
        value={mockSettingsProvider({ avatarStyle: "toonhead" }) as any}
      >
        <Story />
      </SettingsContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("img");
  },
};

/** With saved overrides — shows customized toon head. */
export const WithOverrides: Story = {
  args: { level: 3, seed: "custom-student" },
  decorators: [
    (Story) => (
      <SettingsContext.Provider
        value={
          mockSettingsProvider({
            avatarStyle: "toonhead",
            avatarOverrides: {
              backgroundColor: ["c0aede"],
              hair: ["spiky"],
              eyes: ["happy"],
              mouth: ["smile"],
            },
          }) as any
        }
      >
        <Story />
      </SettingsContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("img");
  },
};
