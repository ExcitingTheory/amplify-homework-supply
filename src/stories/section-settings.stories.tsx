/**
 * @fileoverview Stories for section-level settings pages
 *
 * These pages use `useParams()` for the section ID and load data via subscriptions.
 * In Storybook, the nextjs.navigation parameter provides the route params.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SectionAISettingsClient from "../../app/[locale]/section/[id]/settings/ai/SectionAISettingsClient";
import GamificationSettingsPage from "../../app/[locale]/section/[id]/settings/gamification/page";
import { expect, within } from "storybook/test";

const aiMeta: Meta<typeof SectionAISettingsClient> = {
  title: "📄 Pages/Section Settings/AI Settings",
  component: SectionAISettingsClient,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/section/test-section-123/settings/ai",
        params: { id: "test-section-123" },
      },
    },
  },
};

export default aiMeta;
type AIStory = StoryObj<typeof SectionAISettingsClient>;

export const AISettings: AIStory = {
  play: async ({ canvasElement }) => {
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

// ─── Gamification Settings ─────────────────────────────────────────────

export const GamificationSettings: StoryObj<typeof GamificationSettingsPage> = {
  render: () => <GamificationSettingsPage />,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/section/test-section-456/settings/gamification",
        params: { id: "test-section-456" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
